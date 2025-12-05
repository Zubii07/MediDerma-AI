import { FirebaseApp } from 'firebase/app';
import { FirebaseError } from 'firebase/app';

import { app as defaultFirebaseApp } from '@/firebase/firebase.config';

export class FirebaseServiceError extends Error {
    public readonly code: string;
    public readonly context?: string;

    constructor(message: string, code: string, context?: string) {
        super(message);
        this.name = 'FirebaseServiceError';
        this.code = code;
        this.context = context;
    }
}

export abstract class BaseFirebaseService {
    protected readonly app: FirebaseApp;

    protected constructor(firebaseApp: FirebaseApp = defaultFirebaseApp) {
        this.app = firebaseApp;
    }

    protected handleError(error: unknown, context?: string): never {
        if (error instanceof FirebaseServiceError) {
            throw error;
        }

        if (error instanceof FirebaseError) {
            console.error('Firebase Error:', {
                code: error.code,
                message: error.message,
                context,
            });
            throw new FirebaseServiceError(error.message, error.code, context);
        }

        console.error('Unexpected Firebase Error:', {
            error,
            context,
        });
        throw new FirebaseServiceError(
            'An unexpected Firebase error occurred.',
            'firebase/unexpected-error',
            context
        );
    }
}

