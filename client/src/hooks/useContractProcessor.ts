import { useState } from 'react';

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
}

/**
 * Result of contract processing
 */
export interface ProcessingResult {
  moduleInfo: ModuleInfo;
  governableActions: GovernableAction[];
  governanceContract: string;
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
  const [contractCode, setContractCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectedActions, setDetectedActions] = useState<GovernableAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // API base URL - update this to match your server
  const API_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:50000/api';
  
  /**
   * Handle contract code input change
   */
  const handleContractCodeChange = (value: string) => {
    setContractCode(value);
    // Reset results when code changes
    if (result) {
      setResult(null);
      setError(null);
    }
    
    // Reset detected actions and selections
    setDetectedActions([]);
    setSelectedActions([]);
  };
  
  /**
   * Parse the contract to identify potential governable actions
   */
  const parseContract = async () => {
    if (!contractCode) {
      setError('Please enter contract code');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/parse-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractCode
        }),
      });
      
      const data = await response.json() as ApiResponse<{
        moduleInfo: ModuleInfo,
        governableActions: GovernableAction[]
      }>;
      
      if (!data.success) {
        throw new Error(data.message || 'Error parsing contract');
      }
      
      if (!data.data) {
        throw new Error('No data returned from API');
      }
      
      setDetectedActions(data.data.governableActions);
      
      // Automatically select all actions by default
      setSelectedActions(data.data.governableActions.map(action => action.name));
      
    } catch (err) {
      console.error('Error parsing contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse contract');
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Toggle selection of a governable action
   */
  const toggleActionSelection = (actionName: string) => {
    setSelectedActions(prev => {
      if (prev.includes(actionName)) {
        return prev.filter(name => name !== actionName);
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
      setError('Please select at least one function to govern');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Filter detected actions to only include selected ones
      const actionsToInclude = detectedActions.filter(action => 
        selectedActions.includes(action.name)
      );
      
      const response = await fetch(`${API_URL}/generate-governance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractCode,
          governableActions: actionsToInclude
        }),
      });
      
      const data = await response.json() as ApiResponse<ProcessingResult>;
      
      if (!data.success) {
        throw new Error(data.message || 'Error generating governance contract');
      }
      
      setResult(data.data || null);
    } catch (err) {
      console.error('Error generating governance contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate governance contract');
    } finally {
      setIsProcessing(false);
    }
  };
  
  /**
   * Download the generated governance contract
   */
  const downloadGovernanceContract = () => {
    if (!result?.governanceContract) {
      setError('No governance contract available to download');
      return;
    }
    
    const blob = new Blob([result.governanceContract], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = 'generated_governance.move';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return {
    contractCode,
    isProcessing,
    detectedActions,
    selectedActions,
    result,
    error,
    handleContractCodeChange,
    parseContract,
    generateGovernanceContract,
    downloadGovernanceContract,
    toggleActionSelection
  };
}

export default useContractProcessor;