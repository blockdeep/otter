/**
 * Walrus Client API
 * A TypeScript client for interacting with the Walrus HTTP API for blob storage.
 */

// Types for the Walrus API responses
interface BlobObjectInfo {
    id: string;
    registeredEpoch: number;
    blobId: string;
    size: number;
    encodingType: string;
    certifiedEpoch: number;
    storage: {
      id: string;
      startEpoch: number;
      endEpoch: number;
      storageSize: number;
    };
    deletable: boolean;
  }
  
  interface ResourceOperation {
    registerFromScratch: {
      encodedLength: number;
      epochsAhead: number;
    };
  }
  
  interface NewlyCreatedResponse {
    blobObject: BlobObjectInfo;
    resourceOperation: ResourceOperation;
    cost: number;
  }
  
  interface AlreadyCertifiedResponse {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  }
  
  interface UploadResponse {
    newlyCreated?: NewlyCreatedResponse;
    alreadyCertified?: AlreadyCertifiedResponse;
  }
  
  // Network configuration
  export enum WalrusNetwork {
    TESTNET = 'testnet',
    MAINNET = 'mainnet',
  }
  
  interface NetworkConfig {
    aggregator: string;
    publisher: string;
  }
  
  // Walrus client configuration
  export interface WalrusConfig {
    network: WalrusNetwork;
    customEndpoints?: {
      aggregator?: string;
      publisher?: string;
    };
  }
  
  /**
   * Walrus client for interacting with Walrus blob storage
   */
  export class WalrusClient {
    private aggregator: string;
    private publisher: string;
    private network: WalrusNetwork;
  
    // Default endpoints
    private static readonly DEFAULT_ENDPOINTS: Record<WalrusNetwork, NetworkConfig> = {
      [WalrusNetwork.TESTNET]: {
        aggregator: 'https://aggregator.walrus-testnet.walrus.space',
        publisher: 'https://publisher.walrus-testnet.walrus.space',
      },
      [WalrusNetwork.MAINNET]: {
        aggregator: 'https://aggregator.walrus-mainnet.walrus.space',
        publisher: '', // No default public publisher for mainnet as it costs SUI and WAL
      },
    };
  
    /**
     * Create a new Walrus client
     * @param config Configuration for the client
     */
    constructor(config: WalrusConfig) {
      this.network = config.network;
      
      // Set endpoints based on network and any custom endpoints
      const defaultConfig = WalrusClient.DEFAULT_ENDPOINTS[this.network];
      this.aggregator = config.customEndpoints?.aggregator || defaultConfig.aggregator;
      this.publisher = config.customEndpoints?.publisher || defaultConfig.publisher;
      
      if (!this.publisher && this.network === WalrusNetwork.MAINNET) {
        console.warn('No publisher endpoint specified for mainnet. You will not be able to upload blobs.');
      }
    }
  
    /**
     * Switch the network the client is connected to
     * @param network The network to switch to
     * @param customEndpoints Optional custom endpoints to use
     */
    public switchNetwork(network: WalrusNetwork, customEndpoints?: { aggregator?: string; publisher?: string }) {
      this.network = network;
      
      // Reset to default endpoints for the new network
      const defaultConfig = WalrusClient.DEFAULT_ENDPOINTS[network];
      this.aggregator = customEndpoints?.aggregator || defaultConfig.aggregator;
      this.publisher = customEndpoints?.publisher || defaultConfig.publisher;
      
      if (!this.publisher && network === WalrusNetwork.MAINNET) {
        console.warn('No publisher endpoint specified for mainnet. You will not be able to upload blobs.');
      }
    }
  
    /**
     * Get the current network configuration
     */
    public getNetworkConfig(): { network: WalrusNetwork; aggregator: string; publisher: string } {
      return {
        network: this.network,
        aggregator: this.aggregator,
        publisher: this.publisher,
      };
    }
  
    /**
     * Upload data to Walrus
     * @param data Data to upload (can be string, Blob, ArrayBuffer, or Uint8Array)
     * @param options Upload options
     * @returns Promise resolving to the upload response
     */
    public async uploadBlob(
      data: string | Blob | ArrayBuffer | Uint8Array,
      options: {
        epochs?: number;
        sendObjectTo?: string;
        deletable?: boolean;
      } = {}
    ): Promise<UploadResponse> {
      if (!this.publisher) {
        throw new Error('No publisher endpoint configured. Cannot upload blobs.');
      }
      
      // Build the URL with query parameters
      let url = `${this.publisher}/v1/blobs`;
      const params = new URLSearchParams();
      
      if (options.epochs !== undefined) {
        params.append('epochs', options.epochs.toString());
      }
      
      if (options.sendObjectTo) {
        params.append('send_object_to', options.sendObjectTo);
      }
      
      if (options.deletable) {
        params.append('deletable', 'true');
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      // Set up headers and request body
      const headers: HeadersInit = {
        'Content-Type': 'application/octet-stream',
      };
      
      // Make the request
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json() as Promise<UploadResponse>;
    }
  
    /**
     * Download a blob by its blob ID
     * @param blobId The blob ID to download
     * @returns Promise resolving to the blob data as an ArrayBuffer
     */
    public async downloadBlob(blobId: string): Promise<ArrayBuffer> {
      const url = `${this.aggregator}/v1/blobs/${blobId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      return response.arrayBuffer();
    }
  
    /**
     * Download a blob by the object ID of a Sui blob object
     * @param objectId The Sui object ID
     * @returns Promise resolving to the blob data as an ArrayBuffer
     */
    public async downloadBlobByObjectId(objectId: string): Promise<ArrayBuffer> {
      const url = `${this.aggregator}/v1/blobs/by-object-id/${objectId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      return response.arrayBuffer();
    }
  
    /**
     * Upload a file to Walrus
     * @param file File to upload
     * @param options Upload options
     * @returns Promise resolving to the upload response
     */
    public async uploadFile(
      file: File,
      options: {
        epochs?: number;
        sendObjectTo?: string;
        deletable?: boolean;
      } = {}
    ): Promise<UploadResponse> {
      return this.uploadBlob(file, options);
    }
  
    /**
     * Upload text to Walrus
     * @param text Text to upload
     * @param options Upload options
     * @returns Promise resolving to the upload response
     */
    public async uploadText(
      text: string,
      options: {
        epochs?: number;
        sendObjectTo?: string;
        deletable?: boolean;
      } = {}
    ): Promise<UploadResponse> {
      return this.uploadBlob(text, options);
    }
  
    /**
     * Get the public URL for a blob
     * @param blobId The blob ID
     * @returns The public URL for the blob
     */
    public getBlobUrl(blobId: string): string {
      return `${this.aggregator}/v1/blobs/${blobId}`;
    }
  
    /**
     * Get the public URL for a blob by object ID
     * @param objectId The Sui object ID
     * @returns The public URL for the blob
     */
    public getBlobUrlByObjectId(objectId: string): string {
      return `${this.aggregator}/v1/blobs/by-object-id/${objectId}`;
    }
  }
  
  /**
   * Create a new Walrus client with default configuration
   * @param network The network to connect to
   * @returns A new Walrus client
   */
  export function createWalrusClient(network: WalrusNetwork = WalrusNetwork.TESTNET): WalrusClient {
    return new WalrusClient({ network });
  }
  
  /**
   * Utility to convert a blob to a string
   * @param blob The blob to convert
   * @returns Promise resolving to the string contents of the blob
   */
  export async function blobToString(blob: ArrayBuffer): Promise<string> {
    return new TextDecoder().decode(blob);
  }
  
  /**
   * Utility to convert a blob to a JSON object
   * @param blob The blob to convert
   * @returns Promise resolving to the parsed JSON object
   */
  export async function blobToJson<T = any>(blob: ArrayBuffer): Promise<T> {
    const text = await blobToString(blob);
    return JSON.parse(text);
  }
  
  /**
   * Get a list of available public aggregators for a network
   * @param network The network to get aggregators for
   * @returns Array of available public aggregator endpoints
   */
  export function getPublicAggregators(network: WalrusNetwork): string[] {
    if (network === WalrusNetwork.TESTNET) {
      return [
        'https://agg.test.walrus.eosusa.io',
        'https://aggregator.testnet.walrus.atalma.io',
        'https://aggregator.testnet.walrus.mirai.cloud',
        'https://aggregator.walrus-01.tududes.com',
        'https://aggregator.walrus-testnet.walrus.space',
        'https://aggregator.walrus.banansen.dev',
        'https://aggregator.walrus.testnet.mozcomputing.dev',
        // More endpoints can be found in the documentation
      ];
    } else {
      return [
        'https://agg.walrus.eosusa.io',
        'https://aggregator.mainnet.walrus.mirai.cloud',
        'https://aggregator.suicore.com',
        'https://aggregator.walrus-mainnet.tududes.com',
        'https://aggregator.walrus-mainnet.walrus.space',
        'https://aggregator.walrus.atalma.io',
        'https://aggregator.walrus.mainnet.mozcomputing.dev',
        // More endpoints can be found in the documentation
      ];
    }
  }
  
  /**
   * Get a list of available public publishers for a network
   * @param network The network to get publishers for
   * @returns Array of available public publisher endpoints
   */
  export function getPublicPublishers(network: WalrusNetwork): string[] {
    if (network === WalrusNetwork.TESTNET) {
      return [
        'https://publisher.testnet.walrus.atalma.io',
        'https://publisher.walrus-01.tududes.com',
        'https://publisher.walrus-testnet.walrus.space',
        'https://publisher.walrus.banansen.dev',
        'https://sm1-walrus-testnet-publisher.stakesquid.com',
        // More endpoints can be found in the documentation
      ];
    } else {
      // No public publishers for mainnet as they cost SUI and WAL
      return [];
    }
  }
  
  // Export a default instance for convenience
  export default createWalrusClient();