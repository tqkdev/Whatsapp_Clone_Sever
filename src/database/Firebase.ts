import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, DocumentData } from 'firebase/firestore';
import { getStorage, ref, StorageReference } from 'firebase/storage';
import * as dotenv from 'dotenv';

dotenv.config();

const {
    API_KEY,
    AUTH_DOMAIN,
    FIREBASE_DATABASE_URL,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
    MEASUREMENT_ID,
} = process.env;

const firebaseConfig = {
    apiKey: API_KEY,
    authDomain: AUTH_DOMAIN,
    databaseURL: FIREBASE_DATABASE_URL,
    projectId: PROJECT_ID,
    storageBucket: STORAGE_BUCKET,
    messagingSenderId: MESSAGING_SENDER_ID,
    appId: APP_ID,
    measurementId: MEASUREMENT_ID,
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);
const firestoredatabase: Firestore = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app); // Thêm cấu hình Firebase Storage

export { app, firestoredatabase, collection, doc, DocumentData, storage, ref, StorageReference };
