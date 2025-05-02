/**
 * API service for fetching governance data
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Types for our governance data
export interface GovernanceAddress {
  id: number;
  address: string;
  projectName: string;
  details: string;
  createdAt: string;
  proposals?: Proposal[];
  active?: boolean;
}

export interface Proposal {
  id: number;
  objectId: string;
  creator?: string;
  title?: string;
  status?: number;
  votingEndsAt?: string;
  threshold?: string;
  yes?: number;
  no?: number;
  abstain?: number;
  executed: boolean;
}

/**
 * Fetches all governance addresses from the API
 * @param active - Optional filter for active status
 * @param projectName - Optional filter for project name
 */
export async function getGovernanceAddresses(active?: boolean, projectName?: string): Promise<GovernanceAddress[]> {
  try {
    // Build query parameters if needed
    const params = new URLSearchParams();
    if (active !== undefined) {
      params.append('active', String(active));
    }
    if (projectName) {
      params.append('projectName', projectName);
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/governance-addresses${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Next.js 14 defaults to no-store, specifically set cache option if needed
      cache: 'no-store', // Don't cache this data
    });

    if (!response.ok) {
      throw new Error(`Error fetching governance addresses: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch governance addresses:', error);
    return [];
  }
}

/**
 * Fetches a single governance address by ID
 * @param id - The ID of the governance address to fetch
 */
export async function getGovernanceAddressById(id: string | number): Promise<GovernanceAddress | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/governance-addresses/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching governance address: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch governance address with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetches proposals for a specific governance address
 * @param addressId - The ID of the governance address
 */
export async function getProposalsByGovernanceId(addressId: string | number): Promise<Proposal[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals?governanceId=${addressId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error fetching proposals: ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Failed to fetch proposals for governance ID ${addressId}:`, error);
    return [];
  }
}