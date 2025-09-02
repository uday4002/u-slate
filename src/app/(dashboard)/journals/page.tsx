"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { FiBookOpen, FiTrash2, FiEdit, FiPlus } from "react-icons/fi";
import Spinner from "@/components/utils/spinner";

// Ensure axios always sends cookies
axios.defaults.withCredentials = true;

type Journal = {
    _id: string;
    title: string;
    content: string;
    date?: string;
    mood?: string;
};

const moodColors: Record<string, string> = {
    happy: "bg-green-500",
    sad: "bg-blue-500",
    neutral: "bg-gray-500",
    angry: "bg-red-500",
    excited: "bg-yellow-500",
};

export default function JournalsPage() {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
    const [form, setForm] = useState({
        title: "",
        content: "",
        date: "",
        mood: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(""); // <-- New state for success messages
    const [searchStartDate, setSearchStartDate] = useState("");
    const [searchEndDate, setSearchEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchJournals = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/journal");
            setJournals(res.data);
        } catch (err) {
            setError("Failed to load journals. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJournals();
    }, []);

    useEffect(() => {
        if (!error && !success) return;

        const timer = setTimeout(() => {
            setError("");
            setSuccess(""); // <-- Clear success message too
        }, 5000);

        return () => clearTimeout(timer);
    }, [error, success]); // <-- Depend on success state

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Are you sure you want to delete this journal?");
        if (!confirmed) return;

        try {
            await axios.delete(`/api/journal/${id}`);
            setJournals((prev) => prev.filter((j) => j._id !== id));
            setSuccess("Journal deleted successfully."); // <-- Set success message on delete
        } catch (error) {
            console.error("Failed to delete journal:", error);
            setError("Failed to delete journal.");
        }
    };

    const handleEdit = (journal: Journal) => {
        setEditingJournal(journal);
        setForm({
            title: journal.title,
            content: journal.content,
            date: journal.date ? new Date(journal.date).toISOString().split("T")[0] : "",
            mood: journal.mood || "",
        });
        setModalOpen(true);
        setError("");
        setSuccess("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        if (error) setError("");
        if (success) setSuccess("");
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim() || !form.date) {
            setError("Please fill in required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingJournal) {
                const res = await axios.put(`/api/journal/${editingJournal._id}`, form);
                setJournals(journals.map((j) => (j._id === editingJournal._id ? res.data : j)));
                setSuccess("Journal updated successfully."); // <-- Set success message
            } else {
                const res = await axios.post("/api/journal", form);
                setJournals([res.data, ...journals]);
                setSuccess("Journal added successfully."); // <-- Set success message
            }

            setForm({ title: "", content: "", date: "", mood: "" });
            setError("");
            setEditingJournal(null);
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            setError(editingJournal ? "Failed to update journal." : "Failed to add journal.");
            setSuccess("");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredJournals = journals.filter((j) => {
        if (!j.date) return false;
        const journalDate = new Date(j.date).toISOString().split("T")[0];
        const startDate = searchStartDate ? new Date(searchStartDate).toISOString().split("T")[0] : "";
        const endDate = searchEndDate ? new Date(searchEndDate).toISOString().split("T")[0] : "";

        const isAfterStart = !startDate || journalDate >= startDate;
        const isBeforeEnd = !endDate || journalDate <= endDate;

        return isAfterStart && isBeforeEnd;
    });

    return (
        <div className="bg-zinc-950 min-h-screen p-4 sm:p-12 flex flex-col items-start">
            {/* Header */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                <h1 className="text-xl sm:text-4xl font-bold text-white">Journals</h1>
                <button
                    onClick={() => {
                        setEditingJournal(null);
                        setForm({ title: "", content: "", date: "", mood: "" });
                        setModalOpen(true);
                        setError("");
                        setSuccess("");
                    }}
                    className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-2 rounded-lg text-sm sm:text-base cursor-pointer"
                >
                    <FiPlus /> Add Journal
                </button>
            </div>

            {/* Global Messages */}
            {error && <div className="text-red-500 w-full mb-4 p-2 rounded-lg bg-red-500/20">{error}</div>}
            {success && <div className="w-full rounded-lg bg-green-500/20 text-green-400 p-3 mb-4 transition-opacity duration-300">{success}</div>}


            {/* Date Range Filter */}
            <div className="flex flex-col gap-4 w-full sm:flex-row mb-6">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Start Date Input */}
                    <div className="relative flex-1">
                        <input
                            type="date"
                            value={searchStartDate}
                            onChange={(e) => setSearchStartDate(e.target.value)}
                            className="w-full p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                        />
                        {!searchStartDate && (
                            <span className="absolute left-3 top-2 text-gray-500 pointer-events-none sm:hidden">
                                Start Date
                            </span>
                        )}
                    </div>

                    {/* End Date Input */}
                    <div className="relative flex-1">
                        <input
                            type="date"
                            value={searchEndDate}
                            onChange={(e) => setSearchEndDate(e.target.value)}
                            className="w-full p-2 rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                        />
                        {!searchEndDate && (
                            <span className="absolute left-3 top-2 text-gray-500 pointer-events-none sm:hidden">
                                End Date
                            </span>
                        )}
                    </div>
                </div>

                {/* Clear Button */}
                <div className="w-full sm:w-auto flex justify-end">
                    <button
                        onClick={() => {
                            setSearchStartDate("");
                            setSearchEndDate("");
                        }}
                        className="px-6 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition cursor-pointer w-full sm:w-auto"
                    >
                        Clear
                    </button>
                </div>
            </div>


            {/* No journals placeholder */}
            {loading ? (
                <Spinner />
            ) : filteredJournals.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-12 text-zinc-400 w-full">
                    <FiBookOpen className="sm:w-16 sm:h-16 w-12 h-12 mb-4" />
                    <p className="text-md sm:text-xl font-bold">No journals found</p>
                    <p className="text-sm sm:text-base mt-1 text-center">Start by adding a new journal entry.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                    {filteredJournals.map((j) => (
                        <div
                            key={j._id}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-all"
                        >
                            <div>
                                <h2 className="text-md sm:text-xl font-semibold text-white flex items-center gap-4 break-words">
                                    <FiBookOpen size={45} /> {j.title}
                                </h2>
                                {j.mood && (
                                    <span
                                        className={`inline-block px-2 py-1 mt-1 text-xs rounded-full text-white ${moodColors[j.mood.toLowerCase()] || "bg-gray-400"
                                            }`}
                                    >
                                        {j.mood}
                                    </span>
                                )}
                                <p className="text-zinc-300 mt-2 sm:text-base text-sm break-words">{j.content}</p>
                                <div className="mt-2 text-zinc-400 text-sm sm:text-base">
                                    {j.date && <p className="whitespace-nowrap">Date: {new Date(j.date).toLocaleDateString()}</p>}
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    onClick={() => handleEdit(j)}
                                    className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600 transition text-sm sm:text-base cursor-pointer"
                                >
                                    <FiEdit /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(j._id)}
                                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition text-sm sm:text-base cursor-pointer"
                                >
                                    <FiTrash2 /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Journal Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 pl-18 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
                    onClick={() => {
                        setModalOpen(false);
                        setEditingJournal(null);
                        setError("");
                        setForm({ title: "", content: "", date: "", mood: "" });
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-md sm:text-2xl font-bold text-white mb-4">
                            {editingJournal ? "Update Journal" : "Add New Journal"}
                        </h2>

                        <input
                            type="text"
                            name="title"
                            placeholder="Journal Title"
                            value={form.title}
                            onChange={handleChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        />
                        <textarea
                            name="content"
                            placeholder="Content"
                            value={form.content}
                            onChange={handleChange}
                            rows={5}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600 overflow-auto resize-none scrollbar-hide"
                        />
                        <div className="relative">
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                            />
                            {/* Fake placeholder */}
                            {!form.date && (
                                <span className="absolute left-3 top-2 text-gray-500 pointer-events-none sm:hidden">
                                    yyyy-mm-dd
                                </span>
                            )}
                        </div>
                        <select
                            name="mood"
                            value={form.mood}
                            onChange={handleChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                        >
                            <option value="">Select Mood (optional)</option>
                            <option value="happy">Happy</option>
                            <option value="sad">Sad</option>
                            <option value="neutral">Neutral</option>
                            <option value="angry">Angry</option>
                            <option value="excited">Excited</option>
                        </select>

                        {error && <p className="text-red-500 mb-2">{error}</p>}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setEditingJournal(null);
                                    setForm({ title: "", content: "", date: "", mood: "" });
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
                                {isSubmitting ? (editingJournal ? "Updating..." : "Submitting...") : (editingJournal ? "Update" : "Add")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}