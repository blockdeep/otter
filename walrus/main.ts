/**
 * Walrus Client Demo
 * 
 * This script demonstrates a complete lifecycle of a Walrus blob:
 * 1. Upload a string to Walrus
 * 2. Wait for the blob to be available (120 seconds)
 * 3. Download the blob and verify its contents
 * 4. (If deletable) Delete the blob
 */

import { WalrusClient, WalrusNetwork, blobToString } from './Walrus.ts';

// Utility function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Demo data
const demoContent = `Hello from Walrus!
This is a test string that was stored in Walrus blob storage.
Timestamp: ${new Date().toISOString()}`;

/**
 * Run the Walrus demo
 */
async function runWalrusDemo() {
  console.log('Starting Walrus Demo...');
  
  // Initialize a Walrus client on testnet
  const walrus = new WalrusClient({
    network: WalrusNetwork.TESTNET,
    // Using default testnet endpoints
  });
  
  console.log(`Network config:`, walrus.getNetworkConfig());
  
  try {
    // Step 1: Upload a string to Walrus
    console.log('\n--- Step 1: Uploading string to Walrus ---');
    console.log(`Content to upload (${demoContent.length} bytes):`);
    console.log(demoContent);
    
    const uploadOptions = {
      epochs: 2,      // Store for 2 epochs
      deletable: true // Make the blob deletable
    };
    
    console.log(`\nUploading with options:`, uploadOptions);
    const uploadResponse = await walrus.uploadText(demoContent, uploadOptions);
    
    if (!uploadResponse.newlyCreated && !uploadResponse.alreadyCertified) {
      throw new Error('Upload failed: No blob information returned');
    }
    
    // Determine if this is a new blob or an already existing one
    const isNewBlob = !!uploadResponse.newlyCreated;
    
    // Get the blob ID
    const blobId = isNewBlob 
      ? uploadResponse.newlyCreated?.blobObject.blobId 
      : uploadResponse.alreadyCertified?.blobId;
    
    if (!blobId) {
      throw new Error('Failed to get blob ID from response');
    }
    
    console.log(`\nUpload ${isNewBlob ? 'completed (new blob)' : 'found existing blob'}`);
    console.log(`Blob ID: ${blobId}`);
    
    if (isNewBlob) {
      console.log(`Blob Object ID: ${uploadResponse.newlyCreated?.blobObject.id}`);
      console.log(`Storage cost: ${uploadResponse.newlyCreated?.cost}`);
      console.log(`Storage period: Epochs ${uploadResponse.newlyCreated?.blobObject.storage.startEpoch} - ${uploadResponse.newlyCreated?.blobObject.storage.endEpoch}`);
      console.log(`Deletable: ${uploadResponse.newlyCreated?.blobObject.deletable}`);
    } else {
      console.log(`Transaction: ${uploadResponse.alreadyCertified?.event.txDigest}`);
      console.log(`End Epoch: ${uploadResponse.alreadyCertified?.endEpoch}`);
    }
    
    // Get the public URL
    const blobUrl = walrus.getBlobUrl(blobId);
    console.log(`\nBlob public URL: ${blobUrl}`);
    
    // Step 2: Wait for the blob to be available
    console.log('\n--- Step 2: Waiting for blob to be available (120 seconds) ---');
    const waitTime = 120; // seconds
    for (let i = 0; i < waitTime; i++) {
      await delay(1000);
    }
    console.log('\nWait completed.');
    
    // Step 3: Download the blob
    console.log('\n--- Step 3: Downloading blob ---');
    console.log(`Retrieving blob with ID: ${blobId}`);
    
    try {
      const downloadedData = await walrus.downloadBlob(blobId);
      const downloadedText = await blobToString(downloadedData);
      
      console.log(`\nDownload successful (${downloadedData.byteLength} bytes)`);
      console.log('Downloaded content:');
      console.log(downloadedText);
      
      // Verify the content matches
      if (downloadedText === demoContent) {
        console.log('\n✅ Content verification: PASSED');
      } else {
        console.log('\n❌ Content verification: FAILED - content does not match');
      }
    } catch (error) {
      console.error(`\nDownload failed:`, error);
      throw error;
    }
    
    // Step 4: If the blob is deletable, delete it
    // Note: Deletion requires on-chain transactions using the Sui wallet/SDK
    // and is not directly supported by the HTTP API
    if (isNewBlob && uploadResponse.newlyCreated?.blobObject.deletable) {
      console.log('\n--- Step 4: Deleting blob ---');
      console.log('Note: Deletion requires on-chain transactions using the Sui wallet/SDK.');
      console.log('You would need to:');
      console.log('1. Connect to the Sui blockchain using the Sui SDK');
      console.log('2. Call the delete_blob function on the Walrus contract');
      console.log(`3. Pass the blob object ID: ${uploadResponse.newlyCreated?.blobObject.id}`);
      console.log('\nThis example cannot perform the actual deletion as it requires a Sui wallet.');
      
      console.log('\nWaiting another 120 seconds before completing demo...');
      for (let i = 0; i < waitTime; i++) {
        await delay(1000);
      }
    } else {
      console.log('\n--- Step 4: Deletion not applicable ---');
      if (isNewBlob) {
        console.log('This blob was not created as deletable.');
      } else {
        console.log('This was an existing blob, not created in this session.');
      }
    }
    
    console.log('\nWalrus Demo completed successfully!');
    
  } catch (error) {
    console.error('Error in Walrus Demo:', error);
  }
}

// Run the demo
runWalrusDemo().catch(error => {
  console.error('Fatal error:', error);
});