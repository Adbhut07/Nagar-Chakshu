// functions/src/scheduledSync.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentWritten, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import admin from "../utils/firebase";
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import { logger } from 'firebase-functions';

const db = admin.firestore();

const PROJECT_ID = 'nagar-chakshu';
const LOCATION = 'global';
const DATASTORE_ID = 'my-vertex_1753295752913';
const COLLECTION_NAME = 'summarized_data';
const DATA_RETENTION_DAYS = 1; 

interface FirestoreDocument {
  id: string;
  location?: string;
  summary?: string;
  advice?: string;
  descriptions?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  source_city?: string;
  cluster_id?: number;
  occurrences?: number;
  resolution_time?: {
    __time__: string;
  };
  geohash?: string;
  categories?: string[];
  created_at?: admin.firestore.Timestamp;
  updated_at?: admin.firestore.Timestamp;
  [key: string]: any;
}

// Function to get access token
async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token!;
}

// Function to get existing documents from Vertex AI Data Store
async function getExistingVertexDocuments(): Promise<Set<string>> {
  try {
    const accessToken = await getAccessToken();
    const listUrl = `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATASTORE_ID}/branches/0/documents`;
    
    const allExistingIds = new Set<string>();
    let nextPageToken = '';
    
    // Handle pagination to get ALL documents
    do {
      const params: any = {
        pageSize: 1000 // Maximum allowed
      };
      
      if (nextPageToken) {
        params.pageToken = nextPageToken;
      }
      
      const response = await axios.get(listUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params
      });

      const documents = response.data.documents || [];
      
      documents.forEach((doc: any) => {
        // Extract document ID from the full name path
        // Format: projects/.../locations/.../collections/.../dataStores/.../branches/.../documents/DOCUMENT_ID
        const docId = doc.name.split('/').pop();
        if (docId) {
          allExistingIds.add(docId);
        }
      });

      nextPageToken = response.data.nextPageToken || '';
      
      if (documents.length > 0) {
        logger.info(`Retrieved ${documents.length} documents from Vertex AI (total so far: ${allExistingIds.size})`);
      }
      
    } while (nextPageToken);

    logger.info(`Found ${allExistingIds.size} total existing documents in Vertex AI Data Store`);
    return allExistingIds;
    
  } catch (error: any) {
    logger.error('Error getting existing Vertex documents:', {
      message: error.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    
    // Return empty set on error to avoid breaking the sync
    // The sync will continue and just re-import everything
    logger.warn('Returning empty set due to error - full sync will proceed');
    return new Set<string>();
  }
}

// Function to delete documents from Vertex AI Data Store
async function deleteVertexDocuments(documentIds: string[]): Promise<void> {
  if (documentIds.length === 0) return;

  try {
    const accessToken = await getAccessToken();
    
    logger.info(`Starting deletion of ${documentIds.length} documents from Vertex AI`);
    
    // Delete documents in smaller batches to avoid overwhelming the API
    const batchSize = 20; // Smaller batches for deletions
    let deletedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);
      
      const deletePromises = batch.map(async (docId) => {
        const deleteUrl = `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATASTORE_ID}/branches/0/documents/${docId}`;
        
        try {
          await axios.delete(deleteUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          deletedCount++;
          return { success: true, docId };
        } catch (error: any) {
          if (error?.response?.status === 404) {
            // Document doesn't exist, which is fine
            logger.info(`Document ${docId} already doesn't exist in Vertex AI`);
            return { success: true, docId };
          } else {
            errorCount++;
            logger.error(`Error deleting document ${docId}:`, error.message);
            return { success: false, docId, error: error.message };
          }
        }
      });

      await Promise.all(deletePromises);
      
      logger.info(`Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documentIds.length/batchSize)} - Progress: ${Math.min(i + batchSize, documentIds.length)}/${documentIds.length}`);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < documentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    logger.info(`✅ Deletion completed: ${deletedCount} successful, ${errorCount} errors out of ${documentIds.length} total`);
    
  } catch (error: any) {
    logger.error('❌ Error in bulk deletion process:', error);
    throw error;
  }
}

// Function to import/update documents to Vertex AI Data Store
async function importDocumentsToVertexAI(documents: FirestoreDocument[]): Promise<void> {
  if (documents.length === 0) return;

  try {
    const accessToken = await getAccessToken();
    
    const vertexDocuments = documents.map(doc => {
      // Handle the special resolution_time format
      let resolutionTimeString = '';
      if (doc.resolution_time && doc.resolution_time.__time__) {
        resolutionTimeString = doc.resolution_time.__time__;
      } else if (doc.resolution_time) {
        // Fallback for other formats
        resolutionTimeString = typeof doc.resolution_time === 'string' 
          ? doc.resolution_time 
          : new Date(doc.resolution_time as any).toISOString();
      }

      return {
        id: doc.id,
        structData: {
          location: doc.location || '',
          summary: doc.summary || '',
          advice: doc.advice || '',
          descriptions: doc.descriptions || [],
          coordinates: doc.coordinates || {},
          source_city: doc.source_city || '',
          cluster_id: doc.cluster_id || 0,
          occurrences: doc.occurrences || 0,
          resolution_time: resolutionTimeString,
          geohash: doc.geohash || '',
          categories: doc.categories || [],
          created_at: doc.created_at?.toDate()?.toISOString() || new Date().toISOString(),
          updated_at: doc.updated_at?.toDate()?.toISOString() || new Date().toISOString(),
          // Include any additional fields
          ...Object.keys(doc).reduce((acc, key) => {
            if (!['id', 'location', 'summary', 'advice', 'descriptions', 'coordinates', 'source_city', 'cluster_id', 'occurrences', 'resolution_time', 'geohash', 'categories', 'created_at', 'updated_at'].includes(key)) {
              acc[key] = doc[key];
            }
            return acc;
          }, {} as any)
        }
      };
    });

    const importUrl = `https://discoveryengine.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATASTORE_ID}/branches/0/documents:import`;

    const response = await axios.post(
      importUrl,
      {
        parent: `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATASTORE_ID}/branches/0`,
        inlineSource: {
          documents: vertexDocuments
        },
        reconciliationMode: 'INCREMENTAL'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`Successfully initiated import operation for ${documents.length} documents: ${response.data.name}`);
    
  } catch (error: any) {
    logger.error('Error importing documents to Vertex AI:', {
      message: error.message,
      status: error?.response?.status,
      data: error?.response?.data
    });
    throw error;
  }
}

// Function to get documents from Firestore with optional time filtering
async function getFirestoreDocuments(onlyRecent: boolean = false): Promise<FirestoreDocument[]> {
  try {
    // Since your current data structure doesn't have updated_at timestamps,
    // we'll get all documents and filter them if needed
    const snapshot = await db.collection(COLLECTION_NAME).get();
    const documents: FirestoreDocument[] = [];
    
    const cutoffTime = onlyRecent 
      ? new Date(Date.now() - 16 * 60 * 1000).toISOString() // 16 minutes ago
      : null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (onlyRecent && cutoffTime) {
        // Check if document was recently updated
        // Since we don't have updated_at, we'll use resolution_time as a proxy
        // or check if the document was recently created (for new documents)
        const resolutionTime = data.resolution_time?.__time__;
        const hasRecentTimestamp = data.updated_at?.toDate?.()?.toISOString?.() > cutoffTime;
        
        // Skip if document is too old and doesn't have recent update timestamp
        if (resolutionTime && resolutionTime < cutoffTime && !hasRecentTimestamp) {
          return;
        }
      }
      
      documents.push({
        id: doc.id,
        ...data
      } as FirestoreDocument);
    });
    
    logger.info(`Retrieved ${documents.length} documents from Firestore${onlyRecent ? ' (recent only)' : ''}`);
    return documents;
    
  } catch (error) {
    logger.error('Error getting documents from Firestore:', error);
    throw error;
  }
}

// Function to get old documents from Firestore for cleanup
async function getOldFirestoreDocumentIds(): Promise<string[]> {
  try {
    const cutoffTime = new Date(Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const cutoffTimeString = cutoffTime.toISOString();
    
    // Since your data uses resolution_time.__time__ instead of created_at,
    // we'll use resolution_time for determining old documents
    const snapshot = await db.collection(COLLECTION_NAME).get();
    
    const oldDocIds: string[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const resolutionTime = data.resolution_time?.__time__;
      
      if (resolutionTime && resolutionTime < cutoffTimeString) {
        oldDocIds.push(doc.id);
      }
    });
    
    logger.info(`Found ${oldDocIds.length} old documents to clean up (older than ${DATA_RETENTION_DAYS} days)`);
    return oldDocIds;
    
  } catch (error) {
    logger.error('Error getting old documents from Firestore:', error);
    return [];
  }
}

// 🕐 Main scheduled function that runs every 15 minutes - FULL SYNC
export const syncFirestoreToVertexAI = onSchedule({
  schedule: 'every 15 minutes',
  timeZone: 'Asia/Kolkata',
  region: 'us-central1',
  memory: '2GiB',
  timeoutSeconds: 540,
}, async (event) => {
  logger.info('Starting scheduled FULL SYNC from Firestore to Vertex AI');
  
  try {
    // Step 1: Get ALL current documents from Firestore
    const currentFirestoreDocuments = await getFirestoreDocuments(false);
    const currentFirestoreIds = new Set(currentFirestoreDocuments.map(doc => doc.id));
    
    logger.info(`Found ${currentFirestoreDocuments.length} documents in Firestore`);
    
    // Step 2: Get ALL existing documents from Vertex AI Data Store
    const existingVertexIds = await getExistingVertexDocuments();
    
    logger.info(`Found ${existingVertexIds.size} documents in Vertex AI Data Store`);
    
    // Step 3: Find documents to DELETE from Vertex AI (exist in Vertex but not in Firestore)
    const documentsToDelete = Array.from(existingVertexIds).filter(
      vertexId => !currentFirestoreIds.has(vertexId)
    );
    
    if (documentsToDelete.length > 0) {
      logger.info(`Deleting ${documentsToDelete.length} documents from Vertex AI that no longer exist in Firestore`);
      await deleteVertexDocuments(documentsToDelete);
    }
    
    // Step 4: Import/Update ALL current Firestore documents to Vertex AI
    if (currentFirestoreDocuments.length > 0) {
      logger.info(`Syncing ${currentFirestoreDocuments.length} documents to Vertex AI`);
      
      const batchSize = 50;
      for (let i = 0; i < currentFirestoreDocuments.length; i += batchSize) {
        const batch = currentFirestoreDocuments.slice(i, i + batchSize);
        await importDocumentsToVertexAI(batch);
        logger.info(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(currentFirestoreDocuments.length/batchSize)} with ${batch.length} documents`);
        
        // Add delay between batches to avoid rate limiting
        if (i + batchSize < currentFirestoreDocuments.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Step 5: Optional cleanup of very old data (based on resolution_time)
    // This runs every hour to clean up documents older than DATA_RETENTION_DAYS
    const currentMinute = new Date().getMinutes();
    if (currentMinute < 15) {
      logger.info('Running cleanup of very old data based on retention policy');
      
      const veryOldDocIds = await getOldFirestoreDocumentIds();
      if (veryOldDocIds.length > 0) {
        logger.info(`Found ${veryOldDocIds.length} very old documents to clean up`);
        
        // Delete from Vertex AI
        await deleteVertexDocuments(veryOldDocIds);
        
        // Optionally delete from Firestore as well (uncomment if needed)
        /*
        const batch = db.batch();
        veryOldDocIds.forEach(docId => {
          batch.delete(db.collection(COLLECTION_NAME).doc(docId));
        });
        await batch.commit();
        logger.info(`Deleted ${veryOldDocIds.length} very old documents from Firestore`);
        */
      }
    }
    
    logger.info(`✅ Full sync completed successfully!`);
    logger.info(`📊 Summary: ${currentFirestoreDocuments.length} docs synced, ${documentsToDelete.length} docs deleted from Vertex AI`);
    
  } catch (error) {
    logger.error('❌ Failed to complete full sync:', error);
    throw error;
  }
});

// 🔄 Real-time sync on document creation/update
export const syncOnDocumentChange = onDocumentWritten({
  document: `${COLLECTION_NAME}/{documentId}`,
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 60,
}, async (event) => {
  const documentId = event.params.documentId;
  const newData = event.data?.after?.data();
  
  logger.info(`Document ${documentId} was modified, syncing to Vertex AI`);
  
  if (!newData) {
    logger.info(`Document ${documentId} was deleted, skipping sync`);
    return;
  }
  
  try {
    // Add timestamp if not present
    const documentData = {
      ...newData,
      updated_at: newData.updated_at || admin.firestore.Timestamp.now()
    };
    
    const document: FirestoreDocument = {
      id: documentId,
      ...documentData
    } as FirestoreDocument;
    
    await importDocumentsToVertexAI([document]);
    logger.info(`Successfully synced document ${documentId} to Vertex AI`);
    
  } catch (error) {
    logger.error(`Failed to sync document ${documentId}:`, error);
  }
});

// 🗑️ Real-time sync on document deletion
export const syncOnDocumentDelete = onDocumentDeleted({
  document: `${COLLECTION_NAME}/{documentId}`,
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 30,
}, async (event) => {
  const documentId = event.params.documentId;
  
  logger.info(`Document ${documentId} was deleted, removing from Vertex AI`);
  
  try {
    await deleteVertexDocuments([documentId]);
    logger.info(`Successfully removed document ${documentId} from Vertex AI`);
    
  } catch (error) {
    logger.error(`Failed to remove document ${documentId} from Vertex AI:`, error);
  }
});

// 🔄 Full sync function (for initial setup or manual runs)
export const fullSyncFirestoreToVertexAI = onSchedule({
  schedule: '0 0 31 2 *', // Never runs automatically
  region: 'us-central1',
  memory: '4GiB',
  timeoutSeconds: 540,
}, async (event) => {
  logger.info('Starting full sync from Firestore to Vertex AI');
  
  try {
    // Get all documents from Firestore
    const allDocuments = await getFirestoreDocuments(false);
    
    if (allDocuments.length === 0) {
      logger.info('No documents found in Firestore collection');
      return;
    }
    
    // Import all documents to Vertex AI in batches
    const batchSize = 100;
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize);
      await importDocumentsToVertexAI(batch);
      logger.info(`Processed batch ${Math.floor(i/batchSize) + 1} with ${batch.length} documents`);
      
      if (i + batchSize < allDocuments.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    logger.info(`Successfully completed full sync of ${allDocuments.length} documents`);
    
  } catch (error) {
    logger.error('Failed to complete full sync:', error);
    throw error;
  }
});