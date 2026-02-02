
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export interface AppUser {
    uid: string;
    username: string;
    name: string;
    role: string;
    email?: string;
    profileImage?: string;
}

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    login: (u: string, p: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    refreshUser: async () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load from session
    useEffect(() => {
        const stored = localStorage.getItem("cortex_user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse user session", e);
                localStorage.removeItem("cortex_user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (username: string, pass: string) => {
        // 1. Query Firestore
        const q = query(collection(db, "users"), where("username", "==", username));
        const snap = await getDocs(q);

        if (snap.empty) throw new Error("User not found");

        // 2. Check Password
        const docSnap = snap.docs[0];
        const data = docSnap.data();

        if (data.password !== pass) throw new Error("Invalid password");

        // 3. Success
        const appUser: AppUser = {
            uid: docSnap.id,
            username: data.username,
            name: data.name,
            role: data.role || "CEO of DayLabs",
            email: data.email,
            profileImage: data.profileImage
        };

        setUser(appUser);
        localStorage.setItem("cortex_user", JSON.stringify(appUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("cortex_user");
        router.push("/login");
    };

    const refreshUser = async () => {
        if (!user) return;

        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const updatedUser: AppUser = {
                    uid: docSnap.id,
                    username: data.username,
                    name: data.name,
                    role: data.role || "CEO of DayLabs",
                    email: data.email,
                    profileImage: data.profileImage
                };

                setUser(updatedUser);
                localStorage.setItem("cortex_user", JSON.stringify(updatedUser));
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
