"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Spinner from "@/components/utils/spinner";
import { FiPlus, FiTrash2, FiEdit, FiSearch, FiAward, FiHash, FiCalendar } from "react-icons/fi";
import Link from 'next/link';

// Ensure axios always sends cookies
axios.defaults.withCredentials = true;

export type Certification = {
    _id: string;
    name: string;
    organisation: string;
    certificateId?: string;
    url?: string;
    issueDate?: string;
    createdAt: string;
    updatedAt: string;
};

export default function CertificationsPage() {
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Certification | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [query, setQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        name: "",
        organisation: "",
        certificateId: "",
        url: "",
        issueDate: "",
    });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return certifications;
        return certifications.filter((c) =>
            [c.name, c.organisation, c.certificateId || "", c.url || ""].some((v) =>
                v.toLowerCase().includes(q)
            )
        );
    }, [certifications, query]);

    async function fetchCertifications() {
        setLoading(true);
        try {
            const res = await axios.get("/api/certifications");
            setCertifications(res.data || []);
        } catch (e) {
            console.error("Failed to fetch certifications", e);
            setError("Failed to fetch certifications.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCertifications();
    }, []);

    // Auto-hide error and success messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError("");
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    function openCreateModal() {
        setEditing(null);
        setForm({
            name: "",
            organisation: "",
            certificateId: "",
            url: "",
            issueDate: "",
        });
        setError("");
        setSuccess("");
        setModalOpen(true);
    }

    function onEdit(c: Certification) {
        setEditing(c);
        setForm({
            name: c.name,
            organisation: c.organisation,
            certificateId: c.certificateId || "",
            url: c.url || "",
            issueDate: c.issueDate ? c.issueDate.substring(0, 10) : "",
        });
        setError("");
        setSuccess("");
        setModalOpen(true);
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        if (error) setError("");
        if (success) setSuccess("");
    }

    function validateForm() {
        if (!form.name.trim() || !form.organisation.trim()) {
            setError("Certification name and organisation are required.");
            return false;
        }
        if (form.url) {
            try {
                new URL(form.url.startsWith("http") ? form.url : `https://${form.url}`);
            } catch {
                setError("Enter a valid URL (e.g., https://...)");
                return false;
            }
        }
        return true;
    }

    async function onSubmit() {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            if (editing) {
                const res = await axios.put(`/api/certifications/${editing._id}`, form);
                setCertifications((prev) =>
                    prev.map((c) =>
                        c._id === editing._id ? { ...c, ...(form as any) } : c
                    )
                );
                setSuccess("Certification updated successfully.");
            } else {
                await axios.post("/api/certifications", form);
                setSuccess("Certification added successfully.");
            }
            setError("");
            setEditing(null);
            setModalOpen(false);
            await fetchCertifications();
        } catch (e: any) {
            const msg =
                e?.response?.data?.error ||
                (editing ? "Failed to update." : "Failed to add.");
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Are you sure to want to delete this Certification?")) return;
        try {
            await axios.delete(`/api/certifications/${id}`);
            setCertifications((prev) => prev.filter((c) => c._id !== id));
            setSuccess("Certification deleted successfully.");
        } catch (e) {
            console.error("Failed to delete certification", e);
            setError("Failed to delete certification.");
        }
    }

    return (
        <div className="bg-zinc-950 min-h-screen p-4 sm:p-12 flex flex-col items-start">
            {/* Header */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h1 className="text-xl sm:text-4xl font-bold text-white">
                    Certifications
                </h1>
                <div className="flex w-full sm:w-auto items-center gap-3">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 w-full sm:w-72">
                        <FiSearch />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search certifications..."
                            className="bg-transparent outline-none text-white placeholder-zinc-500 w-full"
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-2 rounded-lg text-sm sm:text-base cursor-pointer"
                    >
                        <FiPlus size={18} /> Add Certification
                    </button>
                </div>
            </div>

            {/* Global Messages */}
            {error && (
                <div className="w-full rounded-lg bg-red-500/20 text-red-400 p-3 mb-4 transition-opacity duration-300">
                    {error}
                </div>
            )}
            {success && (
                <div className="w-full rounded-lg bg-green-500/20 text-green-400 p-3 mb-4 transition-opacity duration-300">
                    {success}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <Spinner />
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-12 text-zinc-400 w-full">
                    <FiAward size={48} className="sm:w-16 sm:h-16 w-12 h-12 mb-4" />
                    <p className="text-md sm:text-xl font-bold">No certifications found</p>
                    <p className="text-sm sm:text-base mt-1 text-center">
                        Start by adding your certifications.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
                    {filtered.map((c) => (
                        <div
                            key={c._id}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-all w-full"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-zinc-800/70">
                                    <FiAward className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-semibold text-base sm:text-lg break-words">
                                        {c.name}
                                    </div>
                                    <div className="text-zinc-400 text-sm break-words">
                                        {c.organisation}
                                    </div>
                                    {c.certificateId && (
                                        <div className="flex items-center gap-1 text-zinc-400 text-xs mt-1 break-words">
                                            <FiHash /> {c.certificateId}
                                        </div>
                                    )}
                                    {c.issueDate && (
                                        <div className="flex items-center gap-1 text-zinc-400 text-xs mt-1 whitespace-nowrap">
                                            <FiCalendar /> {new Date(c.issueDate).toLocaleDateString()}
                                        </div>
                                    )}
                                    {c.url && (
                                        <div className="text-zinc-400 text-xs mt-1 truncate">
                                            <Link
                                                href={c.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                            >
                                                {c.url}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => onEdit(c)}
                                    className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600 transition text-sm sm:text-base cursor-pointer"
                                >
                                    <FiEdit /> Edit
                                </button>
                                <button
                                    onClick={() => onDelete(c._id)}
                                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition text-sm sm:text-base cursor-pointer"
                                >
                                    <FiTrash2 /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 pl-18 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
                    onClick={() => {
                        setModalOpen(false);
                        setEditing(null);
                        setError("");
                        setSuccess("");
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-md sm:text-2xl font-bold text-white mb-4">
                            {editing ? "Update Certification" : "Add New Certification"}
                        </h2>
                        <input
                            type="text"
                            name="name"
                            placeholder="Certification Name"
                            value={form.name}
                            onChange={onChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />

                        <input
                            type="text"
                            name="organisation"
                            placeholder="Organisation"
                            value={form.organisation}
                            onChange={onChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />

                        <input
                            type="text"
                            name="certificateId"
                            placeholder="Certificate ID (Optional)"
                            value={form.certificateId}
                            onChange={onChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />

                        <input
                            type="text"
                            name="url"
                            placeholder="Certification URL (Optional)"
                            value={form.url}
                            onChange={onChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />
                        <div className="relative mb-2">
                            <input
                                type="date"
                                name="issueDate"
                                value={form.issueDate}
                                onChange={onChange}
                                className="p-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                            />
                            {/* Fake placeholder for date input */}
                            {!form.issueDate && (
                                <span className="absolute left-3 top-2 text-gray-500 pointer-events-none sm:hidden">
                                    Issued Date (Optional)
                                </span>
                            )}
                        </div>

                        {error && <p className="text-red-500 mb-2 text-sm">{error}</p>}
                        {success && <p className="text-green-500 mb-2 text-sm">{success}</p>}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setEditing(null);
                                    setForm({ name: "", organisation: "", certificateId: "", url: "", issueDate: "" });
                                    setError("");
                                    setSuccess("");
                                }}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSubmit}
                                disabled={submitting}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
                            >
                                {submitting
                                    ? editing
                                        ? "Updating..."
                                        : "Adding..."
                                    : editing
                                        ? "Update"
                                        : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
