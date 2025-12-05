import constants from '../../app.config';

const extra = constants.expo.extra;

export const config = {
    authTokenKey: extra.AUTH_TOKEN_KEY,
    authUserKey: extra.AUTH_USER_KEY,
    firebase: {
        apiKey: extra.FIREBASE_API_KEY,
        authDomain: extra.FIREBASE_AUTH_DOMAIN,
        projectId: extra.FIREBASE_PROJECT_ID,
        storageBucket: extra.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: extra.FIREBASE_MESSAGING_SENDER_ID,
        appId: extra.FIREBASE_APP_ID,
        measurementId: extra.FIREBASE_MEASUREMENT_ID,
    },
} as const;
