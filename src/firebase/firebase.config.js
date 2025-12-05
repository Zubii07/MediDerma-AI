import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { config } from '@/environment/environment';

/** @type {import('firebase/app').FirebaseOptions} */
const firebaseConfig = {
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId,
    measurementId: config.firebase.measurementId,
};

/** @type {import('firebase/app').FirebaseApp} */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;

if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch {
        auth = getAuth(app);
    }
}

/** @type {import('firebase/auth').Auth} */
const typedAuth = auth;

/** @type {import('firebase/firestore').Firestore} */
const firestore = getFirestore(app);

/** @type {import('firebase/storage').FirebaseStorage} */
const storage = getStorage(app);

export { app, typedAuth as auth, firestore, storage };