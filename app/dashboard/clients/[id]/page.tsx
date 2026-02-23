
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getClient, Client, ClientProject, ClientContract } from "@/lib/firebase-clients";
import { ArrowLeft, Building, Mail, Phone, Globe, Edit, Trash2, CheckSquare, Briefcase, FileText, DollarSign, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ClientTasks } from "@/components/clients/ClientTasks";
import { ClientProjects } from "@/components/clients/ClientProjects";

// Placeholder components to be implemented fully
const OverviewTab = ({ client }: { client: Client }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a href={`mailto:${client.email}`} className="hover:text-blue-600">{client.email}</a>
                </div>
                {client.phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <a href={`tel:${client.phone}`} className="hover:text-blue-600">{client.phone}</a>
                    </div>
                )}
                {client.website && (
                    <div className="flex items-center gap-3 text-gray-600">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <a href={client.website} target="_blank" rel="noreferrer" className="hover:text-blue-600">{client.website}</a>
                    </div>
                )}
                {client.address && (
                    <div className="flex items-center gap-3 text-gray-600">
                        <Building className="w-5 h-5 text-gray-400" />
                        <span>{client.address}</span>
                    </div>
                )}
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{client.notes || "No notes added."}</p>
        </div>
    </div>
);

const ProjectsTab = ({ client }: { client: Client }) => (
    <ClientProjects clientId={client.id} />
);

const TasksTab = ({ client }: { client: Client }) => (
    <ClientTasks clientId={client.id} />
);

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        if (!user || !id) return;

        async function fetchClient() {
            if (!user) return; // Guard for TS
            const data = await getClient(user.uid, id);
            setClient(data);
            setLoading(false);
        }
        fetchClient();
    }, [user, id]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading client data...</div>;
    if (!client) return <div className="p-12 text-center text-red-500">Client not found</div>;

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "projects", label: "Projects", icon: Briefcase },
        { id: "tasks", label: "Tasks", icon: CheckSquare },
        { id: "contracts", label: "Contracts", icon: FileText },
        { id: "finances", label: "Finances", icon: DollarSign },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <Link
                    href="/dashboard/clients"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Clients
                </Link>

                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-3xl">
                            {client.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                            <div className="flex items-center gap-3 mt-1 text-gray-500">
                                {client.company && (
                                    <span className="flex items-center gap-1">
                                        <Building className="w-4 h-4" />
                                        {client.company}
                                    </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {client.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "overview" && <OverviewTab client={client} />}
                {activeTab === "projects" && <ProjectsTab client={client} />}
                {activeTab === "tasks" && <TasksTab client={client} />}
                {activeTab === "contracts" && <div className="text-center text-gray-500 py-12">Contracts module coming soon</div>}
                {activeTab === "finances" && <div className="text-center text-gray-500 py-12">Finances module coming soon</div>}
            </div>
        </div>
    );
}
