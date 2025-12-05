import { Platform } from 'react-native';
import {
    Auth,
    createUserWithEmailAndPassword,
    deleteUser,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    User,
    Unsubscribe,
} from 'firebase/auth';

import { app, auth as rawFirebaseAuth } from '@/firebase/firebase.config';

const firebaseAuth: Auth = rawFirebaseAuth as unknown as Auth;

import { BaseFirebaseService, FirebaseServiceError } from './base.firebase';

export interface EmailSignUpOptions {
    email: string;
    password: string;
    displayName?: string;
}

export class FirebaseAuthService extends BaseFirebaseService {
    protected readonly auth: Auth;
    private readonly googleProvider: GoogleAuthProvider;

    constructor() {
        super(app);
        this.auth = firebaseAuth;
        this.googleProvider = new GoogleAuthProvider();
        this.googleProvider.setCustomParameters({ prompt: 'select_account' });
    }

    public onAuthStateChanged(listener: (user: User | null) => void): Unsubscribe {
        return onAuthStateChanged(this.auth, listener);
    }

    public getCurrentUser(): User | null {
        return this.auth.currentUser;
    }

    public async reloadCurrentUser(): Promise<User | null> {
        try {
            const currentUser = this.auth.currentUser;
            if (currentUser) {
                await currentUser.reload();
            }
            return this.auth.currentUser;
        } catch (error) {
            throw this.handleError(error, 'reloadCurrentUser');
        }
    }

    public async signUpWithEmail({ email, password, displayName }: EmailSignUpOptions): Promise<User> {
        try {
            const credential = await createUserWithEmailAndPassword(this.auth, email, password);
            if (displayName) {
                await updateProfile(credential.user, { displayName });
            }
            return credential.user;
        } catch (error) {
            throw this.handleError(error, 'signUpWithEmail');
        }
    }

    public async signInWithEmail(email: string, password: string): Promise<User> {
        try {
            const credential = await signInWithEmailAndPassword(this.auth, email, password);
            return credential.user;
        } catch (error) {
            throw this.handleError(error, 'signInWithEmail');
        }
    }

    public async signInWithGoogle(): Promise<User> {
        try {
            if (Platform.OS === 'web') {
                const credential = await signInWithPopup(this.auth, this.googleProvider);
                return credential.user;
            }

            throw new FirebaseServiceError(
                'Google sign-in is not implemented for this platform.',
                'auth/unimplemented',
                'signInWithGoogle'
            );
        } catch (error) {
            throw this.handleError(error, 'signInWithGoogle');
        }
    }

    public async signOut(): Promise<void> {
        try {
            await signOut(this.auth);
        } catch (error) {
            throw this.handleError(error, 'signOut');
        }
    }

    public async updateDisplayName(displayName: string): Promise<void> {
        try {
            const currentUser = this.auth.currentUser;
            if (!currentUser) {
                throw new FirebaseServiceError('No authenticated user found.', 'auth/no-current-user', 'updateDisplayName');
            }
            await updateProfile(currentUser, { displayName });
        } catch (error) {
            throw this.handleError(error, 'updateDisplayName');
        }
    }

    public async deleteAccount(): Promise<void> {
        try {
            const currentUser = this.auth.currentUser;
            if (!currentUser) {
                throw new FirebaseServiceError('No authenticated user to delete.', 'auth/no-current-user', 'deleteAccount');
            }
            await deleteUser(currentUser);
        } catch (error) {
            throw this.handleError(error, 'deleteAccount');
        }
    }

    public async sendPasswordReset(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(this.auth, email);
        } catch (error) {
            throw this.handleError(error, 'sendPasswordReset');
        }
    }
}

