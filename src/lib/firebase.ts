import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

let appInstance: FirebaseApp | null = null;
let dbInstance: Database | null = null;

export function getFirebaseApp(): FirebaseApp {
	if (appInstance) return appInstance;
	const config = {
		apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
		authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
		databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
		projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
		appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	};

	if (!config.apiKey || !config.databaseURL || !config.projectId || !config.appId) {
		throw new Error("Missing Firebase env vars. Check NEXT_PUBLIC_FIREBASE_* in .env.local");
	}

	appInstance = getApps().length ? getApps()[0] : initializeApp(config);
	return appInstance;
}

export function getRtdb(): Database {
	if (dbInstance) return dbInstance;
	const app = getFirebaseApp();
	dbInstance = getDatabase(app);
	return dbInstance;
}


