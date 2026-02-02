
"use client";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SplashScreen from "@/components/ui/SplashScreen";
import { useState, useEffect } from "react";

function AuthStateWrapper({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = useState(true);
    const [splashFinished, setSplashFinished] = useState(false);

    useEffect(() => {
        // Check if we've already shown splash this session
        if (typeof window !== "undefined") {
            const hasSeenSplash = sessionStorage.getItem("cortex_splash_seen");
            if (hasSeenSplash === "true") {
                // Already seen, skip splash
                setShowSplash(false);
                setSplashFinished(true);
            } else {
                // First time - show splash and mark as seen
                setShowSplash(true);
                sessionStorage.setItem("cortex_splash_seen", "true");
            }
        }
    }, []);

    const handleSplashFinish = () => {
        setSplashFinished(true);
    };

    // Show splash screen
    if (showSplash && !splashFinished) {
        return <SplashScreen onFinish={handleSplashFinish} />;
    }

    // Show content after splash or if already seen
    if (splashFinished) {
        return <>{children}</>;
    }

    // Initial render before useEffect runs - show nothing briefly
    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AuthStateWrapper>{children}</AuthStateWrapper>
        </AuthProvider>
    );
}
