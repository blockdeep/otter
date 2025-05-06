// SuiMoveAnalyzer.ts - Specialized tools for analyzing Move contracts on Sui

/**
 * Entry point function with its parameters and properties
 */
interface EntryPoint {
    name: string;
    parameters: FunctionParameter[];
    returnType: string | null;
    modifies: string[];
    governanceCandidate: boolean;
  }
  
  /**
   * Parameter of a function
   */
  interface FunctionParameter {
    name: string;
    type: string;
    isMutable: boolean;
  }
  
  /**
   * Struct definition with fields and abilities
   */
  interface StateStruct {
    name: string;
    abilities: string[];
    fields: StructField[];
    isResource: boolean;
  }
  
  /**
   * Field in a struct
   */
  interface StructField {
    name: string;
    type: string;
  }
  
  /**
   * Event definition
   */
  interface EventStruct {
    name: string;
    fields: StructField[];
  }
  
  /**
   * Constant definition
   */
  interface ConstantDef {
    name: string;
    type: string;
    value: string;
  }
  
  /**
   * Imported module
   */
  interface ImportedModule {
    package: string;
    module: string;
    symbols: string[];
  }
  
  /**
   * Results of contract analysis
   */
  interface AnalysisResult {
    entryPoints: EntryPoint[];
    stateStructs: StateStruct[];
    events: EventStruct[];
    constants: ConstantDef[];
    importedModules: ImportedModule[];
  }
  
  /**
   * Utility class with specialized functions for analyzing Sui Move contracts
   */
  class SuiMoveAnalyzer {
    /**
     * Analyze a Sui Move contract to find potential governance points
     * @param contractCode The Move contract code
     * @return Analysis results
     */
    static analyzeContract(contractCode: string): AnalysisResult {
      return {
        entryPoints: this.findEntryPoints(contractCode),
        stateStructs: this.findStateStructs(contractCode),
        events: this.findEvents(contractCode),
        constants: this.findConstants(contractCode),
        importedModules: this.findImports(contractCode)
      };
    }
  
    /**
     * Find all public entry functions in a contract
     * @param contractCode The Move contract code
     * @return List of entry point function details
     */
    static findEntryPoints(contractCode: string): EntryPoint[] {
      const results: EntryPoint[] = [];
      // Regular expression to find public entry functions and their bodies
      const entryPointRegex = /public\s+entry\s+fun\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(?:\s*:\s*([a-zA-Z0-9_<>]+))?\s*{([\s\S]*?)}/g;
      
      let match;
      while ((match = entryPointRegex.exec(contractCode)) !== null) {
        const functionName = match[1];
        const parameterString = match[2];
        const returnType = match[3] || null;
        const functionBody = match[4];
        
        // Parse parameters
        const parameters = this.parseParameters(parameterString);
        
        // Analyze function body to determine what it modifies
        const modifies = this.analyzeFunctionModifications(functionBody);
        
        // Determine if function is a good governance candidate
        const governanceCandidate = this.isGovernanceCandidate(functionName, parameters, functionBody);
        
        results.push({
          name: functionName,
          parameters,
          returnType,
          modifies,
          governanceCandidate
        });
      }
      
      return results;
    }
  
    /**
     * Parse parameter string into structured parameter objects
     * @param parameterString Raw parameter string from function declaration
     * @return Structured parameter objects
     */
    static parseParameters(parameterString: string): FunctionParameter[] {
      if (!parameterString.trim()) return [];
      
      const parameters: string[] = [];
      // Split by commas, but be careful of generic types with commas inside angle brackets
      let depth = 0;
      let currentParam = '';
      
      for (let i = 0; i < parameterString.length; i++) {
        const char = parameterString[i];
        
        if (char === '<') depth++;
        else if (char === '>') depth--;
        
        if (char === ',' && depth === 0) {
          parameters.push(currentParam.trim());
          currentParam = '';
        } else {
          currentParam += char;
        }
      }
      
      if (currentParam.trim()) {
        parameters.push(currentParam.trim());
      }
      
      // Now parse each parameter into name and type
      return parameters.map(param => {
        const [namePart, typePart] = param.split(':').map(p => p.trim());
        const isMutable = namePart.startsWith('mut ');
        
        return {
          name: isMutable ? namePart.substring(4) : namePart,
          type: typePart,
          isMutable
        };
      });
    }
  
    /**
     * Analyze function body to determine what it modifies
     * @param functionBody The body of the function
     * @return List of modified variables/fields
     */
    static analyzeFunctionModifications(functionBody: string): string[] {
      const modifies: string[] = [];
      
      // Look for assignments
      const assignmentRegex = /([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\s*=\s*/g;
      let match;
      
      while ((match = assignmentRegex.exec(functionBody)) !== null) {
        const target = match[1];
        if (!modifies.includes(target)) {
          modifies.push(target);
        }
      }
      
      // Look for calls to mutating functions
      const mutatingCallRegex = /([a-zA-Z0-9_]+)::([a-zA-Z0-9_]+)\(\s*&mut\s+([a-zA-Z0-9_]+)/g;
      
      while ((match = mutatingCallRegex.exec(functionBody)) !== null) {
        const target = match[3];
        if (!modifies.includes(target)) {
          modifies.push(target);
        }
      }
      
      return modifies;
    }
  
    /**
     * Determine if a function is a good governance candidate
     * @param functionName Name of the function
     * @param parameters List of parameters
     * @param functionBody Body of the function
     * @return Whether the function is a good governance candidate
     */
    static isGovernanceCandidate(
      functionName: string, 
      parameters: FunctionParameter[], 
      functionBody: string
    ): boolean {
      // 1. Check function name for governance indicators
      const governanceKeywords = ['set', 'update', 'change', 'modify', 'create', 'add', 'remove', 
                                 'delete', 'mint', 'burn', 'transfer', 'increment', 'decrement'];
      
      const hasGovernanceKeyword = governanceKeywords.some(keyword => 
        functionName.toLowerCase().includes(keyword)
      );
      
      // 2. Check if function requires special capabilities
      // Functions requiring admin caps are usually already governance-gated
      const requiresAdminCap = parameters.some(param => 
        param.type.includes('AdminCap') || 
        param.type.includes('GovernanceCap') ||
        param.name.includes('admin') ||
        param.name.includes('authority')
      );
      
      // 3. Check if function modifies state
      const modifiesState = functionBody.includes('&mut') || 
                            functionBody.includes('=') || 
                            functionBody.includes('insert') ||
                            functionBody.includes('remove') ||
                            functionBody.includes('transfer');
      
      // 4. Look for state mutation patterns specific to Sui
      const hasSuiMutation = 
        functionBody.includes('table::add') ||
        functionBody.includes('table::remove') ||
        functionBody.includes('transfer::transfer') ||
        functionBody.includes('transfer::public_transfer') ||
        functionBody.includes('dynamic_field::add') ||
        functionBody.includes('dynamic_field::remove');
      
      // 5. Avoid functions that are too complex for governance
      // Functions with too many parameters are hard to govern
      const hasTooManyParams = parameters.length > 5;
      
      // Good governance candidates modify state, may have governance keywords,
      // don't require special capabilities, and aren't too complex
      return (hasGovernanceKeyword || hasSuiMutation) && 
             modifiesState && 
             !requiresAdminCap && 
             !hasTooManyParams;
    }
  
    /**
     * Find state-holding structs in a contract
     * @param contractCode The Move contract code
     * @return List of state struct details
     */
    static findStateStructs(contractCode: string): StateStruct[] {
      const results: StateStruct[] = [];
      
      // Find structs with 'key' ability (stored on-chain)
      const structRegex = /struct\s+([a-zA-Z0-9_]+)\s+has\s+(.*?)(?:,\s*store)?\s*{([\s\S]*?)}/g;
      
      let match;
      while ((match = structRegex.exec(contractCode)) !== null) {
        const structName = match[1];
        const abilities = match[2].split(',').map(a => a.trim());
        const fieldsString = match[3];
        
        // Only consider structs with 'key' ability as they can be stored on-chain
        if (abilities.includes('key')) {
          const fields = this.parseStructFields(fieldsString);
          
          results.push({
            name: structName,
            abilities,
            fields,
            isResource: abilities.includes('key') && !abilities.includes('copy')
          });
        }
      }
      
      return results;
    }
  
    /**
     * Parse struct fields into structured field objects
     * @param fieldsString Raw fields string from struct declaration
     * @return Structured field objects
     */
    static parseStructFields(fieldsString: string): StructField[] {
      const fields: StructField[] = [];
      const lines = fieldsString.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//')) continue;
        
        // Field pattern: field_name: field_type,
        const fieldMatch = trimmedLine.match(/([a-zA-Z0-9_]+)\s*:\s*([^,]+),?/);
        if (fieldMatch) {
          fields.push({
            name: fieldMatch[1],
            type: fieldMatch[2].trim()
          });
        }
      }
      
      return fields;
    }
  
    /**
     * Find event structs in a contract
     * @param contractCode The Move contract code
     * @return List of event struct details
     */
    static findEvents(contractCode: string): EventStruct[] {
      const results: EventStruct[] = [];
      
      // Find structs with 'copy, drop' abilities (typical for events)
      const eventRegex = /struct\s+([a-zA-Z0-9_]+)\s+has\s+copy,\s*drop\s*{([\s\S]*?)}/g;
      
      let match;
      while ((match = eventRegex.exec(contractCode)) !== null) {
        const eventName = match[1];
        const fieldsString = match[2];
        
        const fields = this.parseStructFields(fieldsString);
        
        results.push({
          name: eventName,
          fields
        });
      }
      
      return results;
    }
  
    /**
     * Find constants in a contract
     * @param contractCode The Move contract code
     * @return List of constant details
     */
    static findConstants(contractCode: string): ConstantDef[] {
      const results: ConstantDef[] = [];
      
      // Find constant declarations
      const constantRegex = /const\s+([A-Z_0-9]+):\s*([a-zA-Z0-9_<>]+)\s*=\s*([^;]+);/g;
      
      let match;
      while ((match = constantRegex.exec(contractCode)) !== null) {
        const constName = match[1];
        const constType = match[2];
        const constValue = match[3].trim();
        
        results.push({
          name: constName,
          type: constType,
          value: constValue
        });
      }
      
      return results;
    }
  
    /**
     * Find imported modules in a contract
     * @param contractCode The Move contract code
     * @return List of imported module details
     */
    static findImports(contractCode: string): ImportedModule[] {
      const results: ImportedModule[] = [];
      
      // Find import statements
      const importRegex = /use\s+([a-zA-Z0-9_]+)::([a-zA-Z0-9_]+)(?:::([a-zA-Z0-9_{}:,\s]+))?;/g;
      
      let match;
      while ((match = importRegex.exec(contractCode)) !== null) {
        const packageName = match[1];
        const moduleName = match[2];
        const symbols = match[3] ? match[3].trim() : null;
        
        results.push({
          package: packageName,
          module: moduleName,
          symbols: symbols ? this.parseImportSymbols(symbols) : ['*']
        });
      }
      
      return results;
    }
  
    /**
     * Parse import symbols into a structured list
     * @param symbolsString Raw symbols string from import statement
     * @return List of imported symbols
     */
    static parseImportSymbols(symbolsString: string): string[] {
      if (symbolsString.includes('{')) {
        // Handle specific imports like use std::string::{Self, String};
        const bracesContent = symbolsString.match(/{([^}]+)}/);
        if (bracesContent) {
          return bracesContent[1].split(',').map(s => s.trim());
        }
      }
      
      // Single import like use sui::object::UID;
      return [symbolsString];
    }
  }