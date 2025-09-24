/* LearningHabitPage.tsx */

"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Spinner from "@/components/utils/spinner";
import { FiBookOpen, FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import { FaFire, FaStar, FaTrophy, FaSnowflake, FaCheckCircle, FaRegCircle } from "react-icons/fa";

// Ensure axios always sends cookies
axios.defaults.withCredentials = true;

export type LearningHabit = {
    _id: string;
    title: string;
    category: string;
    frequency: "daily" | "weekly";
    target: number;
    progress: { date: string; count: number }[];
    freezes: { date: string }[];
    streak: number;
    longestStreak: number;
    xp: number;
    level: number;
    createdAt?: string;
    updatedAt?: string;
};

type HeatmapFilter = "thisMonth" | "lastMonth" | "pickMonth";

export default function LearningHabitPage() {
    const [habits, setHabits] = useState<LearningHabit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<LearningHabit | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: "",
        category: "",
        frequency: "daily",
        target: 1,
    });

    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [progressValue, setProgressValue] = useState(1);
    const [habitToMark, setHabitToMark] = useState<LearningHabit | null>(null);

    const [heatmapFilters, setHeatmapFilters] = useState<{ [key: string]: HeatmapFilter }>({});
    const [selectedMonths, setSelectedMonths] = useState<{ [key: string]: string }>({});
    const [pickerOpen, setPickerOpen] = useState<{ [key: string]: boolean }>({});
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchHabits();
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

    // Close month picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setPickerOpen({});
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [pickerRef]);

    async function fetchHabits() {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get("/api/learninghabit");
            setHabits(res.data || []);
        } catch {
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setEditing(null);
        setForm({ title: "", category: "", frequency: "daily", target: 1 });
        setModalOpen(true);
        setError("");
        setSuccess("");
    }

    function onEdit(h: LearningHabit) {
        setEditing(h);
        setForm({ title: h.title, category: h.category, frequency: h.frequency, target: h.target });
        setModalOpen(true);
        setError("");
        setSuccess("");
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm((f) => ({ ...f, [e.target.name]: e.target.name === "target" ? Number(e.target.value) : e.target.value }));
    }

    function validateForm() {
        if (form.title.trim() === "") {
            setError("Title is required");
            return false;
        }

        if (form.category.trim() === "") {
            setError("Category is required");
            return false;
        }

        if (form.target < 1) {
            setError("Target must be at least 1");
            return false;
        }

        setError("");
        return true;
    }

    async function submitForm() {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            if (editing) {
                const res = await axios.put(`/api/learninghabit/${editing._id}`, form);
                setHabits((prev) => prev.map((h) => (h._id === editing._id ? res.data : h)));
                setSuccess("Habit updated successfully.");
            } else {
                const res = await axios.post("/api/learninghabit", form);
                setHabits((prev) => [res.data, ...prev]);
                setSuccess("Habit added successfully.");
            }
            setModalOpen(false);
            setEditing(null);
            setForm({ title: "", category: "", frequency: "daily", target: 1 });
            setError("");
        } catch (e: any) {
            setError(e?.response?.data?.error || "Failed to save");
            setSuccess("");
        } finally {
            setSubmitting(false);
        }
    }

    async function onDelete(h: LearningHabit) {
        if (!confirm("Are you sure to want to delete this Habit?")) return;
        try {
            await axios.delete(`/api/learninghabit/${h._id}`);
            setHabits((hs) => hs.filter((habit) => habit._id !== h._id));
            setSuccess("Habit deleted successfully.");
        } catch {
            setError("Delete failed");
            setSuccess("");
        }
    }

    function openProgressModal(h: LearningHabit) {
        setHabitToMark(h);
        const today = new Date();
        const progressForToday = h.progress.find(p => isSameDay(new Date(p.date), today));
        const thisWeekProgress = h.progress.filter(p => isSameWeek(new Date(p.date), today));
        const totalProgress = thisWeekProgress.reduce((sum, p) => sum + p.count, 0);

        if (h.frequency === 'daily') {
            setProgressValue(progressForToday?.count || 1);
        } else {
            setProgressValue(totalProgress || 1);
        }
        setProgressModalOpen(true);
        setError("");
        setSuccess("");
    }

    async function submitProgress() {
        if (!habitToMark) return;
        setSubmitting(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const res = await axios.put(`/api/learninghabit/${habitToMark._id}`, { progress: { date: today.toISOString(), count: progressValue } });
            setHabits((hs) => hs.map((habit) => (habit._id === habitToMark._id ? res.data : habit)));
            setProgressModalOpen(false);
            setSuccess("Progress updated successfully.");
        } catch (e: any) {
            setError(e?.response?.data?.error || "Failed to mark progress");
            setSuccess("");
        } finally {
            setSubmitting(false);
        }
    }

    // FIX: Pass the exact date to the server

    // FIX: Pass the exact date to the server
    async function freezeToday(h: LearningHabit) {
        if (h.frequency !== 'daily') return;
        const today = new Date();

        if (h.progress.some((p) => isSameDay(new Date(p.date), today))) {
            alert("Cannot freeze a completed day");
            return;
        }

        const freezeCount = (h.freezes || []).filter((f) => {
            const d = new Date(f.date);
            return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
        }).length;

        if (freezeCount >= 2) {
            alert("Freeze limit (2) reached this month");
            return;
        }

        try {
            // FIX: Pass the exact date to the server
            const res = await axios.post(`/api/learninghabit/${h._id}/freeze`, { date: today.toISOString() });
            setHabits((hs) => hs.map((habit) => (habit._id === h._id ? res.data : habit)));
            setSuccess("Habit successfully frozen for today.");
        } catch (e: any) {
            alert(e?.response?.data?.error || "Failed to add freeze");
            setError(e?.response?.data?.error || "Failed to add freeze");
            setSuccess("");
        }
    }

    function isSameDay(a: Date, b: Date) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    function isSameWeek(a: Date, b: Date) {
        const startOfWeekA = new Date(a);
        startOfWeekA.setDate(a.getDate() - (a.getDay() === 0 ? 6 : a.getDay() - 1));
        startOfWeekA.setHours(0, 0, 0, 0);

        const startOfWeekB = new Date(b);
        startOfWeekB.setDate(b.getDate() - (b.getDay() === 0 ? 6 : b.getDay() - 1));
        startOfWeekB.setHours(0, 0, 0, 0);

        return startOfWeekA.getTime() === startOfWeekB.getTime();
    }

    function getCalendarDays(year: number, month: number) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        const startDay = firstDay.getDay();
        const totalSlots = daysInMonth + startDay;
        const totalCells = Math.ceil(totalSlots / 7) * 7;

        const days: (Date | null)[] = [];
        for (let i = 0; i < totalCells; i++) {
            if (i < startDay || i >= startDay + daysInMonth) days.push(null);
            else days.push(new Date(year, month, i - startDay + 1));
        }
        return days;
    }

    function onHeatmapFilterChange(e: React.ChangeEvent<HTMLSelectElement>, habitId: string) {
        const val = e.target.value as HeatmapFilter;
        if (val === "pickMonth") {
            setPickerOpen(prev => ({ ...prev, [habitId]: true }));
        } else {
            setPickerOpen(prev => ({ ...prev, [habitId]: false }));
            setSelectedMonths(prev => {
                const newMonths = { ...prev };
                delete newMonths[habitId];
                return newMonths;
            });
            setHeatmapFilters(prev => ({ ...prev, [habitId]: val }));
        }
    }

    function selectMonth(newMonth: string, habitId: string) {
        setSelectedMonths(prev => ({ ...prev, [habitId]: newMonth }));
        setPickerOpen(prev => ({ ...prev, [habitId]: false }));
        setHeatmapFilters(prev => ({ ...prev, [habitId]: "pickMonth" }));
    }

    const dateInfo = (habitId: string) => {
        const now = new Date();
        const filter = heatmapFilters[habitId] || "thisMonth";
        const selectedMonth = selectedMonths[habitId];

        if (filter === "lastMonth") {
            const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        }
        if (filter === "pickMonth" && selectedMonth) {
            const [y, m] = selectedMonth.split("-");
            return { year: Number(y), month: Number(m) - 1 };
        }
        return { year: now.getFullYear(), month: now.getMonth() };
    };

    const isWeeklyTargetMet = (h: LearningHabit) => {
        const today = new Date();
        const thisWeekProgress = h.progress.filter(p => isSameWeek(new Date(p.date), today));
        const totalProgress = thisWeekProgress.reduce((sum, p) => sum + p.count, 0);
        return totalProgress >= h.target;
    };

    // Check if habit is completed for today/this week
    const isTodayCompleted = (h: LearningHabit) => {
        const today = new Date();

        if (h.frequency === "daily") {
            const todayProgress = h.progress.filter(p =>
                isSameDay(new Date(p.date), today)
            );
            const totalCount = todayProgress.reduce((sum, p) => sum + p.count, 0);
            return totalCount >= h.target;
        } else {
            return isWeeklyTargetMet(h);
        }
    };


    return (
        <div className="bg-zinc-950 min-h-screen p-4 sm:p-6 flex flex-col">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-6 px-2 sm:px-0">
                <h1 className="text-xl sm:text-4xl font-bold text-white flex items-center gap-2">
                    <FiBookOpen size={32} /> Learning Habits
                </h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-2 rounded-lg text-sm sm:text-base cursor-pointer"
                >
                    <FiPlus /> Add
                </button>
            </div>

            {/* Global Messages */}
            {error && <div className="text-red-600 w-full rounded p-2 mb-4 animate-fadeInOut">{error}</div>}
            {success && <div className="text-green-600 w-full rounded p-2 mb-4 bg-green-500/20">{success}</div>}

            {loading ? (
                <Spinner />
            ) : habits.length === 0 ? (
                <div className="flex flex-col items-center text-zinc-400 gap-2 w-full text-center mt-12">
                    <FiBookOpen className="text-6xl" />
                    <div>No habits found.</div>
                    <div>Create one to start tracking your learning journey!</div>
                </div>
            ) : (
                <>
                    {/* Habits Grid */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {habits.map((h) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const doneToday = isTodayCompleted(h);
                            const frozenToday = (h.freezes || []).some((f) => isSameDay(new Date(f.date), today));

                            const currentMonthInfo = dateInfo(h._id);
                            const calendarDays = getCalendarDays(currentMonthInfo.year, currentMonthInfo.month);

                            const currentMonthFreezes = h.freezes.filter(f => {
                                const date = new Date(f.date);
                                return date.getFullYear() === currentMonthInfo.year && date.getMonth() === currentMonthInfo.month;
                            }).length;

                            return (
                                <div
                                    key={h._id}
                                    className="bg-zinc-900 rounded-lg p-4 shadow hover:shadow-lg flex flex-col gap-2 relative"
                                >
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="flex flex-col mb-3 break-words overflow-hidden">
                                            <h2 className="text-white font-semibold text-lg">{h.title}</h2>
                                            <p className="text-zinc-400 text-sm">{h.category} ({h.frequency})</p>
                                            {h.createdAt && (
                                                <p className="text-zinc-500 text-xs mt-1">
                                                    Started on: {new Date(h.createdAt).toLocaleDateString(undefined, {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        {/* Month Picker */}
                                        <div className="flex flex-col relative">
                                            <select
                                                className="rounded bg-zinc-800 p-1 text-white text-xs cursor-pointer"
                                                value={heatmapFilters[h._id] || "thisMonth"}
                                                onChange={(e) => onHeatmapFilterChange(e, h._id)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="thisMonth">This Month</option>
                                                <option value="lastMonth">Last Month</option>
                                                <option value="pickMonth">Pick Month...</option>
                                            </select>

                                            {pickerOpen[h._id] && (
                                                <div
                                                    ref={pickerRef}
                                                    className="absolute z-50 bg-black/100 p-4 rounded shadow-lg top-8 right-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="relative">
                                                        <input
                                                            type="month"
                                                            min="2020-01"
                                                            max="2100-12"
                                                            value={selectedMonths[h._id] || ""}
                                                            onChange={(e) => setSelectedMonths(prev => ({ ...prev, [h._id]: e.target.value }))}
                                                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                                                        />
                                                    </div>
                                                    <div className="mt-4 flex justify-end gap-3">
                                                        <button
                                                            className="bg-zinc-700 px-2 py-1 rounded text-white text-sm cursor-pointer"
                                                            onClick={() => setPickerOpen(prev => ({ ...prev, [h._id]: false }))}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            className="bg-blue-600 px-2 py-1 rounded text-white text-sm cursor-pointer"
                                                            disabled={!selectedMonths[h._id]}
                                                            onClick={() => selectMonth(selectedMonths[h._id], h._id)}
                                                        >
                                                            Select
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-1 text-xs sm:text-[12px] md:text-[10px] text-white mb-3 sm:mb-4">
                                        <div className="flex gap-1 items-center">
                                            Streak: {h.streak} <FaFire className="text-orange-500" />
                                        </div>
                                        <div className="flex gap-1 items-center">
                                            Longest: {h.longestStreak} <FaTrophy className="text-yellow-400" />
                                        </div>
                                        <div className="flex gap-1 items-center">
                                            XP: {h.xp} <FaStar className="text-purple-400" />
                                        </div>
                                        {h.frequency === 'daily' && (
                                            <div className="flex gap-1 items-center">
                                                Freezes: {currentMonthFreezes}/2 <FaSnowflake className="text-blue-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 sm:flex sm:flex-nowrap sm:justify-between gap-2 mb-4 text-xs sm:text-[11px] md:text-[10px]">
                                        {/* Always show Mark and Freeze, but disable if doneToday or frozenToday (for Mark), and for Freeze if frozenToday or freeze limit reached */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!doneToday && !frozenToday) openProgressModal(h);
                                            }}
                                            disabled={doneToday || frozenToday}
                                            className={`px-2 py-1 rounded flex items-center justify-center text-white ${doneToday || frozenToday
                                                ? "bg-gray-600 cursor-not-allowed opacity-50"
                                                : "bg-green-600 hover:bg-green-700 cursor-pointer"
                                                }`}
                                        >
                                            <FaCheckCircle className="inline-block mr-1" /> Mark
                                        </button>

                                        {h.frequency === 'daily' && (
                                            <button
                                                disabled={doneToday || frozenToday || currentMonthFreezes >= 2}
                                                title={
                                                    currentMonthFreezes >= 2
                                                        ? "No freezes left this month"
                                                        : doneToday
                                                            ? "Already completed today"
                                                            : frozenToday
                                                                ? "Already frozen today"
                                                                : "Freeze today (only allowed on uncompleted days)"
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!doneToday && !frozenToday && currentMonthFreezes < 2) freezeToday(h);
                                                }}
                                                className={`px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center justify-center ${doneToday || frozenToday ? "cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <FaSnowflake className="inline-block mr-1" /> Freeze
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(h);
                                            }}
                                            className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700 cursor-pointer flex items-center justify-center"
                                        >
                                            <FiEdit className="inline-block mr-1" /> Edit
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(h);
                                            }}
                                            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer flex items-center justify-center"
                                        >
                                            <FiTrash2 className="inline-block mr-1" /> Delete
                                        </button>
                                    </div>


                                    {/* Weekday Labels */}
                                    <div className="grid grid-cols-7 gap-1 text-zinc-400 text-xs font-semibold mb-1 select-none text-center">
                                        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                                    </div>

                                    {/* Calendar heatmap */}
                                    <div className="grid grid-cols-7 gap-1 select-none">
                                        {calendarDays.map((day, idx) => {
                                            if (day === null) return <div key={"empty-" + idx} className="w-6 h-6" />;
                                            const done = h.progress.some((p) => isSameDay(new Date(p.date), day));
                                            const frozen = (h.freezes || []).some((f) => isSameDay(new Date(f.date), day));
                                            const inPast = day.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0);

                                            // Correct logic for weekly completed days
                                            const progressForWeek = h.progress.filter(p => isSameWeek(new Date(p.date), day));
                                            const totalProgressForWeek = progressForWeek.reduce((sum, p) => sum + p.count, 0);
                                            const isWeeklyCompletedDay = h.frequency === 'weekly' && totalProgressForWeek >= h.target;

                                            const missed = inPast && !done && !frozen && !isWeeklyCompletedDay;
                                            const count = h.progress.find((p) => isSameDay(new Date(p.date), day))?.count ?? 0;

                                            let bgColor = "bg-zinc-800";
                                            let tooltipText = "Pending";

                                            if (h.frequency === 'daily' && done) {
                                                bgColor = "bg-green-500";
                                                tooltipText = `Completed: ${count}/${h.target}`;
                                            } else if (h.frequency === 'weekly' && isWeeklyCompletedDay) {
                                                bgColor = "bg-green-500";
                                                tooltipText = `Week Completed`;
                                            } else if (frozen) {
                                                bgColor = "bg-blue-400";
                                                tooltipText = "Frozen";
                                            } else if (missed) {
                                                bgColor = "bg-red-500";
                                                tooltipText = "Missed";
                                            }

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`relative w-6 h-6 rounded border border-zinc-900 cursor-default ${bgColor}`}
                                                    title={`${day.toDateString()}\n${tooltipText}`}
                                                >
                                                    <span className="sr-only">{tooltipText}</span>
                                                    {count > 0 && (
                                                        <div className="absolute bottom-0 right-0 rounded-bl bg-black bg-opacity-70 px-1 text-[10px] font-bold text-white select-none">
                                                            {count}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 pl-18 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
                    onClick={() => { setModalOpen(false); setEditing(null); }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-5"
                    >
                        <h2 className="text-md sm:text-2xl font-bold text-white mb-4">
                            {editing ? "Edit Habit" : "Add Habit"}
                        </h2>

                        <input
                            name="title"
                            value={form.title}
                            onChange={onChange}
                            placeholder="eg: Solve 1 DSA problem daily"
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none"
                            autoFocus
                        />

                        <input
                            name="category"
                            value={form.category}
                            onChange={onChange}
                            placeholder="Category"
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none"
                        />

                        <select
                            name="frequency"
                            value={form.frequency}
                            onChange={onChange}
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>

                        <input
                            type="number"
                            name="target"
                            min={1}
                            value={form.target || ""}
                            onChange={onChange}
                            placeholder="Target"
                            className="p-2 mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        {error && <p className="text-red-500 mb-2">{error}</p>}

                        <div className="flex justify-end gap-2">
                            <button
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 cursor-pointer"
                                onClick={() => { setModalOpen(false); setEditing(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitForm}
                                disabled={submitting}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                            >
                                {submitting ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Modal */}
            {progressModalOpen && habitToMark && (
                <div
                    className="fixed inset-0 pl-18 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
                    onClick={() => { setProgressModalOpen(false); setHabitToMark(null); }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-5 max-w-md"
                    >
                        <h2 className="text-md sm:text-2xl font-bold text-white mb-4">
                            Mark Progress
                        </h2>

                        <div className="text-zinc-400 mb-4 font-semibold text-base break-words">
                            Enter today's progress for '{habitToMark.title}' (Target: {habitToMark.target}):
                        </div>

                        <input
                            id="progressValue"
                            type="number"
                            min={0}
                            value={progressValue}
                            onChange={(e) => setProgressValue(Number(e.target.value))}
                            placeholder={`Target: ${habitToMark.target}`}
                            className="p-2 mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            autoFocus
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 cursor-pointer"
                                onClick={() => { setProgressModalOpen(false); setHabitToMark(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitProgress}
                                disabled={submitting || progressValue <= 0}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                            >
                                {submitting ? "Saving..." : "Save Progress"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}