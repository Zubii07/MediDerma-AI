// src/context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { config } from '@/environment/environment';
import { FirebaseAuthService } from '@/services/firebase/auth.firebase';
import { FirebaseServiceError } from '@/services/firebase/base.firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { FirebaseFirestoreService } from '@/services/firebase/firestore.firebase';

interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signInWithEmail: (email: string, password: string) => Promise<AuthUser>;
    signUpWithEmail: (params: { email: string; password: string; displayName?: string }) => Promise<AuthUser>;
    signInWithGoogle: () => Promise<AuthUser>;
    signOut: () => Promise<void>;
    updateDisplayName: (displayName: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = config.authTokenKey || '@auth_token';
const USER_KEY = config.authUserKey || '@auth_user';

function mapFirebaseUser(user: FirebaseUser): AuthUser {
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const authServiceRef = useRef<FirebaseAuthService>(new FirebaseAuthService());
    const firestoreServiceRef = useRef<FirebaseFirestoreService>(new FirebaseFirestoreService());
    const authService = authServiceRef.current;
    const firestoreService = firestoreServiceRef.current;

    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                const mapped = mapFirebaseUser(firebaseUser);
                setUser(mapped);
                try {
                    const token = await firebaseUser.getIdToken();
                    await Promise.all([
                        AsyncStorage.setItem(TOKEN_KEY, token),
                        AsyncStorage.setItem(USER_KEY, JSON.stringify(mapped)),
                    ]);
                } catch (error) {
                    console.error('Failed to persist Firebase auth state:', error);
                }
            } else {
                setUser(null);
                await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [authService]);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const isLandingRoute =
            segments.length === 0 ||
            (segments.length === 1 && (segments[0] === 'index' || segments[0] === ''));

        if (!user && !inAuthGroup && !isLandingRoute) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)/');
        }
    }, [user, segments, isLoading, router]);

    const ensureAuthUser = (firebaseUser: FirebaseUser | null, context: string): AuthUser => {
        if (!firebaseUser) {
            throw new FirebaseServiceError('Authentication failed. No user returned.', 'auth/no-user', context);
        }
        return mapFirebaseUser(firebaseUser);
    };

    const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
        setIsLoading(true);
        try {
            const firebaseUser = await authService.signInWithEmail(email, password);
            return ensureAuthUser(firebaseUser, 'signInWithEmail');
        } finally {
            setIsLoading(false);
        }
    };

    const signUpWithEmail = async (params: { email: string; password: string; displayName?: string }): Promise<AuthUser> => {
        setIsLoading(true);
        try {
            const firebaseUser = await authService.signUpWithEmail(params);
            return ensureAuthUser(firebaseUser, 'signUpWithEmail');
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async (): Promise<AuthUser> => {
        setIsLoading(true);
        try {
            const firebaseUser = await authService.signInWithGoogle();
            return ensureAuthUser(firebaseUser, 'signInWithGoogle');
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await authService.signOut();
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const updateDisplayName = async (displayName: string): Promise<void> => {
        if (!user) {
            throw new FirebaseServiceError('No authenticated user found.', 'auth/no-user', 'updateDisplayName');
        }
        setIsLoading(true);
        try {
            await authService.updateDisplayName(displayName);
            await firestoreService.updateUserDocument(user.uid, { name: displayName });

            const updatedUser: AuthUser = { ...user, displayName };
            setUser(updatedUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        } finally {
            setIsLoading(false);
        }
    };

    const deleteAccount = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await authService.deleteAccount();
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const sendPasswordReset = async (email: string): Promise<void> => {
        await authService.sendPasswordReset(email);
    };

    const refreshUser = async (): Promise<void> => {
        const firebaseUser = await authService.reloadCurrentUser();
        if (firebaseUser) {
            const mapped = mapFirebaseUser(firebaseUser);
            setUser(mapped);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(mapped));
        }
    };

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isLoading,
            isAuthenticated: !!user,
            signInWithEmail,
            signUpWithEmail,
            signInWithGoogle,
            signOut,
            updateDisplayName,
            deleteAccount,
            sendPasswordReset,
            refreshUser,
        }),
        [user, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
