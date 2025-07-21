// src/firebase.ts or src/utils/firebase.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export default admin;
