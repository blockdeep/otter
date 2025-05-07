// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

/**
 * Extract module information from a Move contract
 */
export function extractModuleInfo(contractCode: string): any {
    // Extract module name and package
    const moduleRegex = /module\s+([a-zA-Z0-9_]+)::([a-zA-Z0-9_]+)\s*{/;
    const moduleMatch = contractCode.match(moduleRegex);
    
    if (!moduleMatch) {
      throw new Error('Unable to detect module name and package');
    }
    
    const packageName = moduleMatch[1];
    const moduleName = moduleMatch[2];
    
    return {
      packageName,
      moduleName
    };
  }
  
  /**
   * Find the main struct in a contract
   */
  export function findMainStruct(contractCode: string): string {
    // Look for structs with 'key' ability
    const structRegex = /struct\s+([a-zA-Z0-9_]+)\s+has\s+(.*?)(?:,\s*store)?\s*{/g;
    
    let match;
    while ((match = structRegex.exec(contractCode)) !== null) {
      const structName = match[1];
      const abilities = match[2].split(',').map(a => a.trim());
      
      // If it has the 'key' ability, it's likely the main struct
      if (abilities.includes('key')) {
        return structName;
      }
    }
    
    // Fallback to a default name if no struct with 'key' ability is found
    return 'AppObject';
  }