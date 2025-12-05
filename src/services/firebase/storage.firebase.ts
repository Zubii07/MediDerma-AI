import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/firebase/firebase.config';
import { BaseFirebaseService, FirebaseServiceError } from './base.firebase';

interface UploadScanResult {
    downloadUrl: string;
    storagePath: string;
}

export class FirebaseStorageService extends BaseFirebaseService {
    constructor() {
        super();
    }

    public async uploadScanImage(userId: string, scanId: string, uri: string): Promise<UploadScanResult> {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const storagePath = `users/${userId}/scans/${scanId}.jpg`;
            const storageRef = ref(storage, storagePath);

            await uploadBytes(storageRef, blob, {
                contentType: 'image/jpeg',
            });

            const downloadUrl = await getDownloadURL(storageRef);

            return { downloadUrl, storagePath };
        } catch (error) {
            this.handleError(error, 'uploadScanImage');
            throw error;
        }
    }

    public async deleteScanImage(imagePath: string): Promise<void> {
        try {
            const storageRef = ref(storage, imagePath);
            await deleteObject(storageRef);
        } catch (error) {
            if ((error as { code?: string }).code === 'storage/object-not-found') {
                return;
            }
            this.handleError(error, 'deleteScanImage');
            throw error;
        }
    }
}

