
import { config } from 'dotenv';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";

// Load environment variables from .env.local
config({ path: '.env.local' });

// Config from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
    console.log("🌱 Starting Seed Process (Custom Auth)...");

    try {
        // 1. Create Admin User Doc
        const adminData = {
            username: "admin",
            password: "admin", // Plaintext password as requested for internal tool
            email: "admin@cortex.app",
            role: "admin",
            name: "Admin User",
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", "admin"), adminData, { merge: true });
        console.log("✅ Admin user created/updated in Firestore: users/admin");
        console.log("   Username: admin");
        console.log("   Password: admin");

        // 2. Add Sample Tasks
        const tasksRef = collection(db, "users", "admin", "tasks");
        const sampleTasks = [
            { title: "Review Initial Plan", status: "done", priority: "high", createdAt: new Date().toISOString() },
            { title: "Finalize UI Design", status: "in-progress", priority: "high", createdAt: new Date().toISOString() },
            { title: "Setup Database", status: "done", priority: "medium", createdAt: new Date().toISOString() }
        ];

        for (const task of sampleTasks) {
            await addDoc(tasksRef, task);
        }
        console.log(`✅ Added ${sampleTasks.length} sample tasks.`);

    } catch (e) {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    }

    console.log("✨ Seeding Complete!");
    process.exit(0);
}

seed();
