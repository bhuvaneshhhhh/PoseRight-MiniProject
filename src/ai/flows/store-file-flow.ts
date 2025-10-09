'use server';
/**
 * @fileOverview A flow for storing a file in Firebase Storage and returning its public URL.
 *
 * - storeFile - The main function to store the file.
 * - StoreFileInput - The Zod schema for the input.
 * - StoreFileOutput - The Zod schema for the output.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Helper function to initialize Firebase on the server-side if not already done.
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  return initializeApp(firebaseConfig);
}

const StoreFileInputSchema = z.object({
  filePath: z.string().describe('The full path where the file should be stored in Firebase Storage, including the file name and extension.'),
  dataUrl: z.string().describe("The file content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

const StoreFileOutputSchema = z.object({
  downloadUrl: z.string().describe('The public URL to access the stored file.'),
});

export type StoreFileInput = z.infer<typeof StoreFileInputSchema>;
export type StoreFileOutput = z.infer<typeof StoreFileOutputSchema>;

const storeFileFlow = ai.defineFlow(
  {
    name: 'storeFileFlow',
    inputSchema: StoreFileInputSchema,
    outputSchema: StoreFileOutputSchema,
  },
  async ({ filePath, dataUrl }) => {
    const firebaseApp = getFirebaseApp();
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, filePath);
    
    // Upload the file from the data URL
    const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
    
    // Get the public download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return { downloadUrl };
  }
);

export async function storeFile(
  input: StoreFileInput
): Promise<StoreFileOutput> {
  return storeFileFlow(input);
}
