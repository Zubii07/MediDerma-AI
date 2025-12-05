declare module '@/firebase/firebase.config' {
    import type { FirebaseApp } from 'firebase/app';
    import type { Auth } from 'firebase/auth';

    export const app: FirebaseApp;
    export const auth: Auth;
    export const firestore: import('firebase/firestore').Firestore;
    export const storage: import('firebase/storage').FirebaseStorage;
}

