import {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    deleteDoc,
    orderBy,
} from 'firebase/firestore';

import { firestore } from '@/firebase/firebase.config';
import { AncestralDataDocument } from '@/types/firestore';

import { BaseFirebaseService } from './base.firebase';

interface CreateAncestralDataInput {
    userId: string;
    data: Omit<AncestralDataDocument, 'uploadedAt'>;
}

interface UpdateAncestralDataInput {
    userId: string;
    analysisId: string;
    data: Partial<AncestralDataDocument>;
}

export class FirebaseAncestralDataService extends BaseFirebaseService {
    constructor() {
        super();
    }

    public async listAncestralData(userId: string): Promise<Array<{ id: string; data: AncestralDataDocument }>> {
        try {
            const collectionRef = collection(firestore, 'users', userId, 'ancestralData');
            const snapshot = await getDocs(query(collectionRef, orderBy('uploadedAt', 'desc')));

            return snapshot.docs.map((docSnapshot) => ({
                id: docSnapshot.id,
                data: docSnapshot.data() as AncestralDataDocument,
            }));
        } catch (error) {
            this.handleError(error, 'listAncestralData');
            throw error;
        }
    }

    public async createAncestralData({ userId, data }: CreateAncestralDataInput): Promise<string> {
        try {
            const docRef = doc(collection(firestore, 'users', userId, 'ancestralData'));
            const payload: AncestralDataDocument = {
                ...data,
                uploadedAt: serverTimestamp() as any,
            };
            await setDoc(docRef, payload);
            return docRef.id;
        } catch (error) {
            this.handleError(error, 'createAncestralData');
            throw error;
        }
    }

    public async updateAncestralData({ userId, analysisId, data }: UpdateAncestralDataInput): Promise<void> {
        try {
            const docRef = doc(firestore, 'users', userId, 'ancestralData', analysisId);
            await updateDoc(docRef, {
                ...data,
                uploadedAt: serverTimestamp(),
            });
        } catch (error) {
            this.handleError(error, 'updateAncestralData');
            throw error;
        }
    }

    public async deleteAncestralData(userId: string, analysisId: string): Promise<void> {
        try {
            const docRef = doc(firestore, 'users', userId, 'ancestralData', analysisId);
            await deleteDoc(docRef);
        } catch (error) {
            this.handleError(error, 'deleteAncestralData');
            throw error;
        }
    }
}

