import {
    collection,
    deleteDoc,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
    updateDoc,
    QueryDocumentSnapshot,
    DocumentData,
} from 'firebase/firestore';

import { firestore } from '@/firebase/firebase.config';
import { ScanDocument, ScanStatus, UserProfileDocument } from '@/types/firestore';

import { BaseFirebaseService } from './base.firebase';

export class FirebaseFirestoreService extends BaseFirebaseService {
    constructor() {
        super();
    }

    public async createScanDocument(input: {
        userId: string;
        scanId: string;
        imagePath: string;
        downloadUrl?: string;
        status?: ScanStatus;
        additionalData?: Partial<ScanDocument>;
    }): Promise<void> {
        const { userId, scanId, imagePath, downloadUrl, status = 'pending_analysis', additionalData } = input;
        const scanRef = this.getScanDocRef(userId, scanId);

        const scanDoc: Partial<ScanDocument> = {
            imagePath,
            imageUrl: downloadUrl,
            status,
            capturedAt: serverTimestamp() as unknown as ScanDocument['capturedAt'],
            createdAt: serverTimestamp() as unknown as ScanDocument['createdAt'],
            updatedAt: serverTimestamp() as unknown as ScanDocument['updatedAt'],
            ...additionalData,
        };

        await setDoc(scanRef, scanDoc, { merge: true });
    }

    public async updateScanDocument(userId: string, scanId: string, data: Partial<ScanDocument>): Promise<void> {
        const scanRef = this.getScanDocRef(userId, scanId);

        await updateDoc(scanRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
    }

    public async listScans(userId: string): Promise<Array<{ id: string; data: ScanDocument }>> {
        try {
            const scansCollection = collection(firestore, 'users', userId, 'scans');
            const scanQuery = query(scansCollection, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(scanQuery);

            return snapshot.docs.map((docSnapshot) => ({
                id: docSnapshot.id,
                data: docSnapshot.data() as ScanDocument,
            }));
        } catch (error) {
            this.handleError(error, 'listScans');
            throw error;
        }
    }

    public async listScansPage(
        userId: string,
        pageSize: number,
        cursor?: QueryDocumentSnapshot<DocumentData> | null
    ): Promise<{
        records: Array<{ id: string; data: ScanDocument }>;
        lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    }> {
        try {
            const scansCollection = collection(firestore, 'users', userId, 'scans');
            let scanQuery = query(scansCollection, orderBy('createdAt', 'desc'), limit(pageSize));

            if (cursor) {
                scanQuery = query(scansCollection, orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize));
            }

            const snapshot = await getDocs(scanQuery);

            const records = snapshot.docs.map((docSnapshot) => ({
                id: docSnapshot.id,
                data: docSnapshot.data() as ScanDocument,
            }));

            const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

            return { records, lastDoc };
        } catch (error) {
            this.handleError(error, 'listScansPage');
            throw error;
        }
    }

    public async getScanCount(userId: string): Promise<number> {
        try {
            const scansCollection = collection(firestore, 'users', userId, 'scans');
            const countSnapshot = await getCountFromServer(scansCollection);
            return countSnapshot.data().count ?? 0;
        } catch (error) {
            this.handleError(error, 'getScanCount');
            throw error;
        }
    }

    public async deleteScanDocument(userId: string, scanId: string): Promise<void> {
        try {
            const scanRef = this.getScanDocRef(userId, scanId);
            await deleteDoc(scanRef);
        } catch (error) {
            this.handleError(error, 'deleteScanDocument');
            throw error;
        }
    }

    public async updateUserDocument(userId: string, data: Partial<UserProfileDocument>): Promise<void> {
        const userRef = doc(firestore, 'users', userId);
        await setDoc(
            userRef,
            {
                ...data,
                lastLogin: serverTimestamp(),
            },
            { merge: true }
        );
    }

    public async updateProfileData(userId: string, data: Partial<UserProfileDocument>): Promise<void> {
        const userRef = doc(firestore, 'users', userId);
        await setDoc(userRef, data, { merge: true });
    }

    public async getUserProfile(userId: string): Promise<UserProfileDocument | null> {
        const userRef = doc(firestore, 'users', userId);
        const snapshot = await getDoc(userRef);
        if (!snapshot.exists()) {
            return null;
        }
        return snapshot.data() as UserProfileDocument;
    }

    private getScanDocRef(userId: string, scanId: string) {
        return doc(firestore, 'users', userId, 'scans', scanId);
    }
}

