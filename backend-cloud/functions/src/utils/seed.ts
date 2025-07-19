import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// ✅ Use service account from local file
// eslint-disable-next-line max-len
const serviceAccountPath = path.join(__dirname, "../../firebase-admin-key.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account key file not found:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// ✅ Load dummy data from JSON
const filePath = path.join(__dirname, "../dummy_data.json");

if (!fs.existsSync(filePath)) {
  console.error("❌ Dummy data file not found:", filePath);
  process.exit(1);
}

const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));

if (!Array.isArray(jsonData.data)) {
  console.error("❌ JSON structure invalid. Expected 'data' array.");
  process.exit(1);
}

// ✅ Upload dummy data to Firestore
async function uploadToFirestore() {
  const batch = db.batch();
  const collectionRef = db.collection("social_media_posts");

  jsonData.data.forEach((doc: any) => {
    const docRef = collectionRef.doc(); // Auto-ID
    batch.set(docRef, doc);
  });

  await batch.commit();
  console.log(`✅ Uploaded ${jsonData.data.length} documents to Firestore`);
}

uploadToFirestore().catch((err) => {
  console.error("❌ Error uploading data:", err);
});
