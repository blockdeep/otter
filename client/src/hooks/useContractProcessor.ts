import { API_BASE_URL } from "@/config";
import { useState } from "react";

// TODO: Need a lot of refactoring
// 1. Move types/interfaces to seperate file
// 2. Move all fetching logics to TanStack and export required stuff
// 3. Remove all redundant states like loading, error etc.
// 4. Actual fetching logic can be moved to a Factory class, and TanStack query wrappers could be used inorder to code maintainability and readability.

/**
 * Parameter information for governable functions
 */
export interface ParameterInfo {
  name: string;
  type: string;
}

/**
 * Information about a governable action
 */
export interface GovernableAction {
  name: string;
  parameters: ParameterInfo[];
  description?: string;
}

/**
 * Module information extracted from contract
 */
export interface ModuleInfo {
  packageName: string;
  moduleName: string;
  address?: string;
}

/**
 * Result of contract processing
 */
export interface ProcessingResult {
  packageId?: string;
  moduleInfo: ModuleInfo;
  mainStruct?: string;
  governableActions: GovernableAction[];
  governanceContract: string;
  governanceTokenContract: string;
}

/**
 * API response type
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Hook for contract processing integration
 */
export function useContractProcessor() {
  const [contractCode, setContractCode] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<"code" | "package">("code");
  const [rpcUrl, setRpcUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectedActions, setDetectedActions] = useState<GovernableAction[]>(
    [],
  );
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle contract code input change
   */
  const handleContractCodeChange = (value: string) => {
    setContractCode(value);
    // Reset results when code changes
    resetResults();
  };

  /**
   * Handle package ID input change
   */
  const handlePackageIdChange = (value: string) => {
    setPackageId(value);
    // Reset results when package ID changes
    resetResults();
  };

  /**
   * Reset all results and selections
   */
  const resetResults = () => {
    setResult(null);
    setError(null);
    setDetectedActions([]);
    setSelectedActions([]);
  };

  /**
   * Switch between input methods
   */
  const switchInputMethod = (method: "code" | "package") => {
    setInputMethod(method);
    resetResults();
    setContractCode("");
    setPackageId("");
  };

  /**
   * Parse the contract to identify potential governable actions
   */
  const parseContract = async () => {
    if (inputMethod === "code" && !contractCode) {
      setError("Please enter contract code");
      return;
    }

    if (inputMethod === "package" && !packageId) {
      setError("Please enter package ID");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const endpoint =
        inputMethod === "code"
          ? "parse-contract"
          : "generate-governance-from-package";

      const requestBody =
        inputMethod === "code"
          ? { contractCode }
          : { packageId, rpcUrl: rpcUrl || undefined };

      const response = await fetch(`${API_BASE_URL}/contract/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as ApiResponse<{
        packageId?: string;
        moduleInfo: ModuleInfo;
        mainStruct?: string;
        governableActions: GovernableAction[];
        governanceContract?: string;
        governanceTokenContract?: string;
      }>;

      if (!data.success) {
        throw new Error(
          data.message ||
            `Error ${inputMethod === "code" ? "parsing contract" : "processing package"}`,
        );
      }

      if (!data.data) {
        throw new Error("No data returned from API");
      }

      setDetectedActions(data.data.governableActions);

      // Automatically select all actions by default
      setSelectedActions(
        data.data.governableActions.map((action) => action.name),
      );

      // If using package ID method and contracts are already generated, set the result
      if (
        inputMethod === "package" &&
        data.data.governanceContract &&
        data.data.governanceTokenContract
      ) {
        setResult({
          packageId: data.data.packageId,
          moduleInfo: data.data.moduleInfo,
          mainStruct: data.data.mainStruct,
          governableActions: data.data.governableActions,
          governanceContract: data.data.governanceContract,
          governanceTokenContract: data.data.governanceTokenContract,
        });
      }
    } catch (err) {
      console.error(
        `Error ${inputMethod === "code" ? "parsing contract" : "processing package"}:`,
        err,
      );
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${inputMethod === "code" ? "parse contract" : "process package"}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Toggle selection of a governable action
   */
  const toggleActionSelection = (actionName: string) => {
    setSelectedActions((prev) => {
      if (prev.includes(actionName)) {
        return prev.filter((name) => name !== actionName);
      } else {
        return [...prev, actionName];
      }
    });
  };

  /**
   * Generate governance contract based on selected functions
   */
  const generateGovernanceContract = async () => {
    if (selectedActions.length === 0) {
      setError("Please select at least one function to govern");
      return;
    }

    // If using package method and already have the result, just filter the actions
    if (inputMethod === "package" && result) {
      const filteredActions = detectedActions.filter((action) =>
        selectedActions.includes(action.name),
      );
      setResult({
        ...result,
        governableActions: filteredActions,
      });
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Filter detected actions to only include selected ones
      const actionsToInclude = detectedActions.filter((action) =>
        selectedActions.includes(action.name),
      );

      const response = await fetch(`${API_BASE_URL}/contract/generate-governance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractCode,
          governableActions: actionsToInclude,
        }),
      });

      const data = (await response.json()) as ApiResponse<ProcessingResult>;

      if (!data.success) {
        throw new Error(data.message || "Error generating governance contract");
      }

      setResult(data.data || null);
    } catch (err) {
      console.error("Error generating governance contract:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate governance contract",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Download the generated governance contracts
   */
  const downloadGovernanceContracts = () => {
    if (!result?.governanceContract) {
      setError("No governance contract available to download");
      return;
    }

    // Download governance contract
    const governanceBlob = new Blob([result.governanceContract], {
      type: "text/plain",
    });
    const governanceUrl = URL.createObjectURL(governanceBlob);
    const governanceLink = document.createElement("a");

    governanceLink.href = governanceUrl;
    governanceLink.download = `${result.moduleInfo.packageName}_governance.move`;
    document.body.appendChild(governanceLink);
    governanceLink.click();

    // Clean up
    URL.revokeObjectURL(governanceUrl);
    document.body.removeChild(governanceLink);

    // Download token contract if available
    if (result.governanceTokenContract) {
      const tokenBlob = new Blob([result.governanceTokenContract], {
        type: "text/plain",
      });
      const tokenUrl = URL.createObjectURL(tokenBlob);
      const tokenLink = document.createElement("a");

      tokenLink.href = tokenUrl;
      tokenLink.download = `${result.moduleInfo.packageName}_govtoken.move`;
      document.body.appendChild(tokenLink);
      tokenLink.click();

      // Clean up
      URL.revokeObjectURL(tokenUrl);
      document.body.removeChild(tokenLink);
    }
  };

  return {
    contractCode,
    packageId,
    inputMethod,
    rpcUrl,
    isProcessing,
    detectedActions,
    selectedActions,
    result,
    error,
    handleContractCodeChange,
    handlePackageIdChange,
    switchInputMethod,
    setRpcUrl,
    parseContract,
    generateGovernanceContract,
    downloadGovernanceContracts,
    toggleActionSelection,
  };
}

export default useContractProcessor;
