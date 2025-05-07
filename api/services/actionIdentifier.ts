// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

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
 * Identify all public entry functions in a Move contract
 * without applying filtering heuristics
 */
export function identifyAllPotentialActions(
  contractCode: string
): GovernableAction[] {
  const potentialActions: GovernableAction[] = [];

  // Look for all public entry functions
  const functionRegex =
    /public\s+(entry\s+)?fun\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/g;

  let match;
  while ((match = functionRegex.exec(contractCode)) !== null) {
    const isEntry = match[1] !== undefined; // Check if function has 'entry' modifier
    const functionName = match[2];
    const parametersRaw = match[3];

    console.log(functionName, isEntry);

    // Parse parameters
    const parameters = parseParameters(parametersRaw);

    // Extract function description from comments above the function
    const description = extractFunctionDescription(contractCode, functionName);

    // Add to potential governable actions with description
    potentialActions.push({
      name: functionName,
      parameters,
      description,
    });
  }

  return potentialActions;
}

/**
 * Identify governable actions in a Move contract with original heuristics
 * for backward compatibility
 */
export function identifyGovernableActions(
  contractCode: string
): GovernableAction[] {
  const governableActions: GovernableAction[] = [];

  // Look for public | entry functions
  const functionRegex =
    /public\s+(entry\s+)?fun\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)/g;

  let match;
  while ((match = functionRegex.exec(contractCode)) !== null) {
    const functionName = match[2];
    const parametersRaw = match[3];

    if (
      functionName.startsWith("get_") ||
      functionName.startsWith("is_") ||
      functionName.startsWith("has_")
    ) {
      continue;
    }

    // Parse parameters
    const parameters = parseParameters(parametersRaw);

    console.log(
      functionName,
      isFunctionGovernable(functionName, parameters, contractCode)
    );

    // Check if the function is a good governance candidate
    if (isFunctionGovernable(functionName, parameters, contractCode)) {
      // Extract function description from comments above the function
      const description = extractFunctionDescription(
        contractCode,
        functionName
      );

      governableActions.push({
        name: functionName,
        parameters,
        description,
      });
    }
  }

  return governableActions;
}

/**
 * Parse parameters from a parameter string
 */
export function parseParameters(parametersRaw: string): ParameterInfo[] {
  if (!parametersRaw.trim()) return [];

  const paramList = parametersRaw.split(",").map((p) => p.trim());
  return paramList.map((param) => {
    const [name, type] = param.split(":").map((p) => p.trim());
    return { name, type };
  });
}

/**
 * Extract function description from comments
 */
export function extractFunctionDescription(
  contractCode: string,
  functionName: string
): string | undefined {
  // Look for comments above the function declaration
  const commentRegex = new RegExp(
    `((?:\\/\\/.*\\n)+)\\s*public\\s+(entry\\s+)?fun\\s+${functionName}\\s*\\(`,
    "m"
  );
  const match = contractCode.match(commentRegex);

  if (match && match[1]) {
    // Clean up the comment
    return match[1]
      .split("\n")
      .map((line) => line.replace(/^\s*\/\/\s*/, "").trim())
      .filter((line) => line)
      .join(" ");
  }

  // If no comment found, infer a description based on the function name and structure

  // Check the function body to understand what it does
  const functionBodyRegex = new RegExp(
    `fun\\s+${functionName}\\s*\\(.*?\\)\\s*{([\\s\\S]*?)}`,
    "s"
  );
  const functionBodyMatch = contractCode.match(functionBodyRegex);
  const functionBody = functionBodyMatch ? functionBodyMatch[1] : "";

  // Identify if this is an admin or governance function
  const requiresCapability = functionBody.includes("assert!(is_authorized");
  const requiresAdmin = functionBody.includes(
    "assert!(tx_context::sender(ctx) == marketplace.admin"
  );

  // Extended list of descriptive keywords for functions
  const functionDescriptors: Record<string, string> = {
    // State modification functions
    set: "Sets or updates a value",
    update: "Updates a value or state",
    change: "Changes a value or state",
    modify: "Modifies a value or state",
    create: "Creates a new resource or entry",
    add: "Adds a new item or value",
    remove: "Removes an item or value",
    delete: "Deletes an item or resource",
    increment: "Increments a counter or value",
    decrement: "Decrements a counter or value",

    // Governance/admin functions
    pause: "Pauses functionality or operations",
    unpause: "Resumes functionality or operations",
    freeze: "Freezes functionality or operations",
    unfreeze: "Unfreezes functionality or operations",
    enable: "Enables a feature or functionality",
    disable: "Disables a feature or functionality",
    configure: "Configures parameters or settings",
    register: "Registers a new component or entity",
    unregister: "Unregisters a component or entity",
    setup: "Sets up or initializes functionality",
    mint: "Creates new tokens or assets",
    burn: "Destroys tokens or assets",
    transfer: "Transfers ownership or control",
    withdraw: "Withdraws funds or resources",
    deposit: "Deposits funds or resources",
    stake: "Stakes tokens or resources",
    unstake: "Unstakes tokens or resources",
    claim: "Claims rewards or resources",
    propose: "Creates a governance proposal",
    vote: "Casts a vote on a proposal",
    execute: "Executes an approved action",
    cancel: "Cancels an operation or action",
    admin: "Administrative function",
    govern: "Governance-related function",
    list: "Lists an item or resource",
    buy: "Purchases an item or resource",
    sell: "Sells an item or resource",
  };

  // Check for matches in function name
  for (const [keyword, description] of Object.entries(functionDescriptors)) {
    if (functionName.toLowerCase().includes(keyword)) {
      // Add governance/admin context if relevant
      if (requiresCapability) {
        return `${description} (requires governance approval)`;
      } else if (requiresAdmin) {
        return `${description} (admin-only function)`;
      }
      return `${description} (auto-detected)`;
    }
  }

  // Default descriptions based on context
  if (requiresCapability) {
    return "Executes a governance-controlled operation (requires governance approval)";
  } else if (requiresAdmin) {
    return "Executes an admin-only operation";
  }

  return "Executes a state change in the contract";
}

/**
 * Determine if a function is a good governance candidate
 */
export function isFunctionGovernable(
  functionName: string,
  parameters: ParameterInfo[],
  contractCode: string
): boolean {
  // 1. Check if function name suggests a governance action
  const governanceKeywords = [
    "set",
    "update",
    "change",
    "modify",
    "create",
    "add",
    "remove",
    "delete",
    "increment",
    "decrement",
    "pause",
    "unpause",
    "toggle",
    "enable",
    "disable",
    "configure",
    "register",
    "unregister",
  ];

  const hasGovernanceKeyword = governanceKeywords.some((keyword) =>
    functionName.toLowerCase().includes(keyword)
  );

  // 2. Check if function has public entry modifier (most governance functions are entry)
  const isEntryFunction = new RegExp(
    `public\\s+entry\\s+fun\\s+${functionName}\\s*\\(`,
    "m"
  ).test(contractCode);

  // 3. Check if function accepts governance capability or has "governance" in name
  const hasGovernanceContext =
    functionName.toLowerCase().includes("governance") ||
    parameters.some(
      (param) =>
        param.type.includes("Governance") ||
        param.type.includes("Gov") ||
        param.name.toLowerCase().includes("governance") ||
        param.name.toLowerCase().includes("gov")
    );

  // 4. Look for state modifications in function body
  const functionBodyRegex = new RegExp(
    `fun\\s+${functionName}\\s*\\(.*?\\)\\s*{([\\s\\S]*?)}`,
    "s"
  );
  const functionBodyMatch = contractCode.match(functionBodyRegex);
  const functionBody = functionBodyMatch ? functionBodyMatch[1] : "";

  const hasStateModification =
    functionBody.includes(".") || // Field access
    functionBody.includes("=") || // Assignment
    functionBody.includes("::"); // Module function calls

  // If it has a governance keyword and modifies state, it's governable
  if (hasGovernanceKeyword && hasStateModification) {
    return true;
  }

  // If it accepts governance capability or has governance in name, it's governable
  if (hasGovernanceContext && hasStateModification) {
    return true;
  }

  // Check if function is called from other governance functions
  // This helps identify auxiliary functions that are part of governance
  const isFunctionCalledFromGovernance = contractCode.includes(
    `${functionName}(`
  );

  // If it's an entry function that modifies state and isn't a getter/query
  if (
    isEntryFunction &&
    hasStateModification &&
    !functionName.startsWith("get_") &&
    !functionName.startsWith("is_")
  ) {
    return true;
  }

  return false;
}
