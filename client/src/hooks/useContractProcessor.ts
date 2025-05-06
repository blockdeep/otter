// Hook for contract processing integration with the backend

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
  };
  
  /**
   * Process the contract
   */
  const processContract = async () => {
    if (!contractCode) {
      setError('Please enter contract code');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/process-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractCode
        }),
      });
      
      const data = await response.json() as ApiResponse<ProcessingResult>;
      
      if (!data.success) {
        throw new Error(data.message || 'Error processing contract');
      }
      
      setResult(data.data || null);
    } catch (err) {
      console.error('Error processing contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to process contract');
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
    result,
    error,
    handleContractCodeChange,
    processContract,
    downloadGovernanceContract
  };
}

export default useContractProcessor;