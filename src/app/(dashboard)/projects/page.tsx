"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "@/components/utils/spinner";

// Inline SVG icons to replace react-icons.
const FiFolder = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
const FiTrash2 = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);
const FiGithub = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.5a6.04 6.04 0 0 0-3 0c-2.73-1.85-3.91-1.5-4.1-1.1s-.68.65-.68 1.9c0 5.4 3.3 6.64 6.44 7A3.37 3.37 0 0 0 17 14.13V19"></path></svg>
);
const FiExternalLink = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
);
const FiPlus = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const FiEdit = ({ size = 24, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);


// Ensure axios always sends cookies
axios.defaults.withCredentials = true;

type Project = {
    _id: string;
    name: string;
    description: string;
    liveLink?: string;
    githubLink?: string;
    startDate?: string;
    endDate?: string;
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        githubLink: "",
        liveLink: "",
        startDate: "",
        endDate: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(""); // <-- New state for success messages
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function fetchProjects() {
        try {
            const res = await axios.get("/api/projects");
            setProjects(res.data);
        } catch (err) {
            setError("Failed to fetch projects.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!error && !success) return;
        const timer = setTimeout(() => {
            setError("");
            setSuccess(""); // <-- Clear success message
        }, 5000);

        return () => clearTimeout(timer);
    }, [error, success]); // <-- Add success to the dependency array

    async function handleDelete(id: string) {
        const confirmed = window.confirm("Are you sure you want to delete this project?");
        if (!confirmed) return;

        try {
            await axios.delete(`/api/projects/${id}`);
            setProjects((prev) => prev.filter((p) => p._id !== id));
            setSuccess("Project deleted successfully."); // <-- Set success message
        } catch (error) {
            setError("Failed to delete project.");
        }
    };

    function handleEdit(project: Project) {
        setEditingProject(project);
        setForm({
            name: project.name,
            description: project.description,
            githubLink: project.githubLink || "",
            liveLink: project.liveLink || "",
            startDate: project.startDate || "",
            endDate: project.endDate || "",
        });
        setModalOpen(true);
        setError("");
        setSuccess("");
    };

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError("");
        if (success) setSuccess("");
    };

    async function handleSubmit() {
        if (!form.name.trim() || !form.description.trim()) {
            setError("Please fill in required fields (Name and Description).");
            return;
        }

        if (form.startDate && form.endDate) {
            const start = new Date(form.startDate);
            const end = new Date(form.endDate);
            if (end < start) {
                setError("End Date cannot be earlier than Start Date.");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            if (editingProject) {
                const res = await axios.put(`/api/projects/${editingProject._id}`, form);
                setProjects(
                    projects.map((p) => (p._id === editingProject._id ? res.data : p))
                );
                setSuccess("Project updated successfully."); // <-- Set success message
            } else {
                const res = await axios.post("/api/projects", form);
                setProjects([res.data, ...projects]);
                setSuccess("Project added successfully."); // <-- Set success message
            }
            setForm({ name: "", description: "", githubLink: "", liveLink: "", startDate: "", endDate: "" });
            setError("");
            setEditingProject(null);
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            setError(editingProject ? "Failed to update project." : "Failed to add project.");
            setSuccess("");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="bg-zinc-950 min-h-screen p-4 sm:p-12 flex flex-col items-start font-sans">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6">
                <h1 className="text-xl sm:text-4xl font-bold text-white">Projects</h1>
                <button
                    onClick={() => {
                        setEditingProject(null);
                        setForm({ name: "", description: "", githubLink: "", liveLink: "", startDate: "", endDate: "" });
                        setModalOpen(true);
                        setError("");
                        setSuccess("");
                    }}
                    className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-2 rounded-lg text-[12px] sm:text-base cursor-pointer"
                >
                    <FiPlus size={16} /> Add Project
                </button>
            </div>

            {/* Global Messages */}
            {error && <div className="w-full rounded-lg bg-red-500/20 text-red-400 p-3 mb-4 transition-opacity duration-300">{error}</div>}
            {success && <div className="w-full rounded-lg bg-green-500/20 text-green-400 p-3 mb-4 transition-opacity duration-300">{success}</div>}

            {/* No projects placeholder */}
            {loading ? (
                <Spinner />
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-12 text-zinc-400 w-full">
                    <FiFolder size={48} className="sm:w-16 sm:h-16 w-12 h-12 mb-4" />
                    <p className="text-md sm:text-xl font-bold">No projects found</p>
                    <p className="text-sm sm:text-base mt-1 text-center">
                        Start by adding a new project to showcase your work.
                    </p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                    {projects.map((p) => (
                        <div
                            key={p._id}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-all min-w-0"
                        >
                            <div className="min-w-0">
                                {/* Project Name + Icon */}
                                <div className="text-md sm:text-xl font-semibold text-white flex items-start gap-2 break-words whitespace-normal overflow-hidden">
                                    <FiFolder size={22} className="shrink-0" />
                                    <span className="break-words whitespace-normal">{p.name}</span>
                                </div>

                                {/* Description */}
                                <p className="text-zinc-300 mt-2 sm:text-base text-sm break-words">
                                    {p.description}
                                </p>

                                {/* Links */}
                                <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 items-center">
                                    {p.githubLink && (
                                        <a
                                            href={p.githubLink}
                                            target="_blank"
                                            className="flex items-center gap-1 text-blue-500 hover:underline text-sm sm:text-base"
                                        >
                                            <FiGithub size={16} /> GitHub
                                        </a>
                                    )}
                                    {p.liveLink && (
                                        <a
                                            href={p.liveLink}
                                            target="_blank"
                                            className="flex items-center gap-1 text-green-500 hover:underline text-sm sm:text-base"
                                        >
                                            <FiExternalLink size={16} /> Live
                                        </a>
                                    )}
                                </div>

                                {/* Dates */}
                                <div className="mt-2 text-zinc-400 text-sm sm:text-base">
                                    {p.startDate && <p>Start: {new Date(p.startDate).toLocaleDateString()}</p>}
                                    {p.endDate && <p>End: {new Date(p.endDate).toLocaleDateString()}</p>}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => handleEdit(p)}
                                    className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600 transition text-sm sm:text-base cursor-pointer"
                                >
                                    <FiEdit size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(p._id)}
                                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition text-sm sm:text-base cursor-pointer"
                                >
                                    <FiTrash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>

                    ))}
                </div>
            )}

            {/* Add / Edit Project Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 pl-18 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
                    onClick={() => {
                        setModalOpen(false);
                        setEditingProject(null);
                        setError("");
                        setSuccess("");
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-md sm:text-2xl font-bold text-white mb-4">
                            {editingProject ? "Update Project" : "Add New Project"}
                        </h2>

                        <input
                            type="text"
                            name="name"
                            placeholder="Project Name"
                            value={form.name}
                            onChange={handleChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />
                        <textarea
                            name="description"
                            placeholder="Description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600 overflow-auto resize-none scrollbar-hide"
                        />
                        <input
                            type="text"
                            name="githubLink"
                            placeholder="GitHub Link (optional)"
                            value={form.githubLink}
                            onChange={handleChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />
                        <input
                            type="text"
                            name="liveLink"
                            placeholder="Live Link (optional)"
                            value={form.liveLink}
                            onChange={handleChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />
                        <div className="relative">
                            <input
                                type="date"
                                name="startDate"
                                placeholder="Start Date (optional)"
                                value={form.startDate}
                                onChange={handleChange}
                                className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                            />
                            {!form.startDate && (
                                <span className="absolute left-3 top-2 text-gray-500 pointer-events-none sm:hidden">
                                    start date
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type="date"
                                name="endDate"
                                placeholder="End Date (optional)"
                                value={form.endDate}
                                onChange={handleChange}
                                className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                            />
                            {!form.endDate && (
                                <span className="absolute left-3 top-2 text-gray-500 pointer-events-none sm:hidden">
                                    end date
                                </span>
                            )}
                        </div>

                        {error && <p className="text-red-500 mb-2">{error}</p>}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setEditingProject(null);
                                    setForm({ name: "", description: "", githubLink: "", liveLink: "", startDate: "", endDate: "" });
                                }}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (editingProject ? "Updating..." : "Submitting...") : (editingProject ? "Update" : "Add")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}