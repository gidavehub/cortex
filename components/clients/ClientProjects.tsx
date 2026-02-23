
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ClientProject } from "@/lib/types/client";
import { subscribeClientProjects, createProject, deleteProject, updateProject, CreateProjectInput } from "@/lib/firebase-projects";
import { Plus, Briefcase, Calendar, DollarSign, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClientProjectsProps {
    clientId: string;
}

export function ClientProjects({ clientId }: ClientProjectsProps) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<ClientProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<CreateProjectInput>({
        clientId,
        name: "",
        description: "",
        status: "Planned",
        budget: 0,
        deadline: undefined
    });

    useEffect(() => {
        if (!user || !clientId) return;
        const unsubscribe = subscribeClientProjects(user.uid, clientId, (data) => {
            setProjects(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, clientId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            await createProject(user.uid, {
                ...formData,
                clientId // Ensure clientId is set
            });
            setIsFormOpen(false);
            setFormData({ clientId, name: "", description: "", status: "Planned", budget: 0 }); // Reset
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (confirm("Delete this project?")) {
            await deleteProject(user.uid, id);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Projects & Sites</h3>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    New Project
                </button>
            </div>

            {/* Project Creation Form (Inline for simplicity) */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                required
                                placeholder="Project Name"
                                className="px-4 py-2 rounded-xl border border-gray-200"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <select
                                className="px-4 py-2 rounded-xl border border-gray-200"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="Planned">Planned</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    placeholder="Budget"
                                    className="w-full pl-9 px-4 py-2 rounded-xl border border-gray-200"
                                    value={formData.budget || ''}
                                    onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                                />
                            </div>
                            <input
                                type="date"
                                className="px-4 py-2 rounded-xl border border-gray-200"
                                value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                                onChange={e => setFormData({ ...formData, deadline: e.target.value ? new Date(e.target.value) : undefined })}
                            />
                            <textarea
                                placeholder="Description"
                                className="col-span-2 px-4 py-2 rounded-xl border border-gray-200"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">Save Project</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {projects.map(project => (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={project.id}
                        className="group flex flex-col md:flex-row md:items-center p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all bg-white"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-gray-900">{project.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                        project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {project.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{project.description || "No description provided."}</p>
                        </div>

                        <div className="flex items-center gap-6 mt-4 md:mt-0 text-gray-500">
                            <div className="flex items-center gap-2 text-sm">
                                <DollarSign className="w-4 h-4 text-green-500" />
                                <span className="font-medium text-gray-900">${project.budget.toLocaleString()}</span>
                            </div>
                            {project.deadline && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                </div>
                            )}
                            <button
                                onClick={() => handleDelete(project.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {projects.length === 0 && !loading && !isFormOpen && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-600">No projects yet</p>
                        <p className="text-sm mb-4">Create a project to track work and budget</p>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Create your first project
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
