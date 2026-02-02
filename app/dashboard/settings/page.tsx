
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Save, Lock, User, Camera, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [role, setRole] = useState(user?.role || "CEO of DayLabs");
    const [profileImage, setProfileImage] = useState(user?.profileImage || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // Update form when user changes
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setUsername(user.username || "");
            setRole(user.role || "CEO of DayLabs");
            setProfileImage(user.profileImage || "");
        }
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess("");
        setError("");

        if (!user) return;

        // Validate password match
        if (password && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setSaving(true);

        try {
            const updates: Record<string, string> = {};
            if (name) updates.name = name;
            if (username) updates.username = username;
            if (role) updates.role = role;
            if (profileImage) updates.profileImage = profileImage;
            if (password) updates.password = password;

            await updateDoc(doc(db, "users", user.uid), updates);
            await refreshUser(); // Refresh the context
            setSuccess("Profile updated successfully!");
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error(err);
            setError("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[#1A1C1E]">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your profile and preferences</p>
            </div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[24px] shadow-soft overflow-hidden"
            >
                {/* Profile Header with Image */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 relative">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    </div>
                    <div className="relative flex items-center gap-6">
                        {/* Profile Image */}
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold text-white shadow-xl overflow-hidden">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0).toUpperCase() || "U"
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="text-white">
                            <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
                            <p className="text-blue-100">{user?.role || "CEO of DayLabs"}</p>
                            <p className="text-blue-200 text-sm mt-1">@{user?.username}</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-500" />
                        Profile Information
                    </h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="Isoko"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="username"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Role</label>
                        <input
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="CEO of DayLabs"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-600">Profile Image URL</label>
                        <input
                            type="url"
                            value={profileImage}
                            onChange={(e) => setProfileImage(e.target.value)}
                            placeholder="https://example.com/your-image.jpg"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <p className="text-xs text-gray-400">Enter a URL to your profile image</p>
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Lock className="w-5 h-5 text-blue-500" />
                            Account Security
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Leave password fields empty to keep current password</p>
                    </div>

                    {/* Status Messages */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
                            >
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">{success}</span>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                            >
                                <AlertCircle className="w-5 h-5" />
                                <span className="font-medium">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-[#3B82F6] text-white rounded-2xl font-medium shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
