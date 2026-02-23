
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Client, subscribeClients } from "@/lib/firebase-clients";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Phone, Mail, Building, Tag } from "lucide-react";
import Link from "next/link";

export default function ClientsPage() {
    const { user } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("All");

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeClients(user.uid, (data) => {
            setClients(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'Active').length,
        leads: clients.filter(c => c.status === 'Leads').length,
        revenue: clients.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0)
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Client Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage relationships, projects, and contracts.</p>
                </div>
                <Link
                    href="/dashboard/clients/new"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" />
                    New Client
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Clients', value: stats.total, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Active Clients', value: stats.active, color: 'bg-green-50 text-green-600' },
                    { label: 'Leads', value: stats.leads, color: 'bg-yellow-50 text-yellow-600' },
                    { label: 'Total Revenue', value: `$${stats.revenue.toLocaleString()}`, color: 'bg-indigo-50 text-indigo-600' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={stat.label}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
                    >
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-2 ${stat.color} w-fit px-3 py-1 rounded-lg`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search clients, companies, emails..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 text-gray-600 placeholder:text-gray-400"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'Active', 'Leads', 'Inactive'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === status
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredClients.map((client) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={client.id}
                            className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                        >
                            <Link href={`/dashboard/clients/${client.id}`} className="block p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {client.name.charAt(0)}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${client.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            client.status === 'Leads' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {client.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {client.name}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                                    {client.company && (
                                        <>
                                            <Building className="w-3 h-3" />
                                            {client.company}
                                        </>
                                    )}
                                </p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        {client.email}
                                    </div>
                                    {client.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {client.phone}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-50">
                                    {client.tags?.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-md">
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredClients.length === 0 && !loading && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8" />
                        </div>
                        <p className="text-lg font-medium text-gray-600">No clients found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
