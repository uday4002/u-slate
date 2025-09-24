"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaTasks, FaTrash } from "react-icons/fa";
import { IoFilterSharp } from "react-icons/io5";
import { FiCalendar, FiClock, FiPlay, FiCheckCircle, FiPlus } from "react-icons/fi";
import Spinner from "@/components/utils/spinner";

// Ensure axios always sends cookies
axios.defaults.withCredentials = true;

type Task = {
    _id: string;
    title: string;
    dueDate?: string;
    status: "pending" | "inprogress" | "completed";
    priority: "low" | "medium" | "high";
};

type NewTask = {
    title: string;
    dueDate: string;
    priority: "low" | "medium" | "high";
    status: "pending" | "inprogress" | "completed";
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newTask, setNewTask] = useState<NewTask>({
        title: "",
        dueDate: "",
        priority: "low",
        status: "pending",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(""); // <-- New state for success messages

    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [loading, setLoading] = useState(true);

    // Memoized fetch function to prevent unnecessary re-renders
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterStatus) params.status = filterStatus;
            if (filterPriority) params.priority = filterPriority;

            const res = await axios.get("/api/tasks", { params });
            setTasks(res.data);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch tasks");
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterPriority]);

    // Fetch tasks on filter change and component mount
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Auto-hide error and success messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError("");
                setSuccess(""); // <-- Clear success message
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]); // <-- Depend on both error and success

    async function addTask() {
        if (!newTask.title) {
            setError("Please Enter a task title");
            return;
        }

        // Validate due date not in past
        if (newTask.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(newTask.dueDate);
            if (dueDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)) {
                setError("Due date cannot be in the past");
                return;
            }
        }

        try {
            await axios.post("/api/tasks", newTask);
            setNewTask({ title: "", dueDate: "", priority: "low", status: "pending" });
            setShowModal(false);
            setError("");
            setSuccess("Task added successfully!"); // <-- Set success message
            await fetchTasks();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to add task");
        }
    };

    async function updateStatus(task: Task, newStatus: Task["status"]) {
        try {
            const res = await axios.put(`/api/tasks/${task._id}`, { status: newStatus });
            setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
            setError("");
            setSuccess(`Task status updated to "${newStatus}"!`); // <-- Set success message on update
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to update task status");
        }
    };

    async function deleteTask(taskId: string) {
        if (!confirm("Are you sure to want to delete this tasks?")) return;
        try {
            await axios.delete(`/api/tasks/${taskId}`);
            setTasks(tasks.filter((t) => t._id !== taskId));
            setError("");
            setSuccess("Task deleted successfully!"); // <-- Set success message on delete
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to delete task");
        }
    };

    // ---- UI helpers ----
    const priorityBadge = (p: Task["priority"]) =>
        p === "low"
            ? "bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/30"
            : p === "medium"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30"
                : "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-400/30";

    const statusChip = (s: Task["status"]) =>
        s === "completed"
            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30"
            : s === "inprogress"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-400/30"
                : "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30";

    const StatusIcon = ({ s }: { s: Task["status"] }) =>
        s === "completed" ? (
            <FiCheckCircle className="h-4 w-4" />
        ) : s === "inprogress" ? (
            <FiPlay className="h-4 w-4" />
        ) : (
            <FiClock className="h-4 w-4" />
        );

    return (
        <div className="bg-zinc-950 min-h-screen p-4 sm:p-6 w-full">
            <div className="w-full ">
                {/* Header */}
                <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <h1 className="text-xl sm:text-4xl font-bold text-white">Tasks</h1>
                    <div className="flex w-full gap-2 sm:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 sm:w-auto cursor-pointer"
                        >
                            <IoFilterSharp /> Filters
                        </button>
                        <button
                            onClick={() => { setShowModal(true); setError(""); setSuccess(""); }}
                            className="flex items-center gap-2 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-blue-500 sm:w-auto cursor-pointer"
                        >
                            <FiPlus /> Add Task
                        </button>
                    </div>
                </div>

                {/* Global Messages */}
                {error && <div className="w-full rounded-lg bg-red-500/20 text-red-400 p-3 mb-4 transition-opacity duration-300">{error}</div>}
                {success && <div className="w-full rounded-lg bg-green-500/20 text-green-400 p-3 mb-4 transition-opacity duration-300">{success}</div>}

                {/* Filters */}
                {showFilters && (
                    <div className="mb-6 divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                        <div className="pb-4">
                            <p className="font-semibold text-zinc-100">Status</p>
                            <div className="mt-2 flex flex-wrap gap-4">
                                {["", "pending", "inprogress", "completed"].map((s) => (
                                    <label
                                        key={s}
                                        className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300 hover:text-white"
                                    >
                                        <input
                                            type="radio"
                                            value={s}
                                            checked={filterStatus === s}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="accent-blue-500"
                                        />
                                        {s === "" ? "All" : s}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <p className="font-semibold text-zinc-100">Priority</p>
                            <div className="mt-2 flex flex-wrap gap-4">
                                {["", "low", "medium", "high"].map((p) => (
                                    <label
                                        key={p}
                                        className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300 hover:text-white"
                                    >
                                        <input
                                            type="radio"
                                            value={p}
                                            checked={filterPriority === p}
                                            onChange={(e) => setFilterPriority(e.target.value)}
                                            className="accent-blue-500"
                                        />
                                        {p === "" ? "All" : p}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Task list */}
                {loading ? (
                    <Spinner />
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 py-14 text-center text-zinc-400">
                        <FaTasks className="mb-3 text-5xl opacity-60" />
                        <p className="text-md sm:text-lg font-medium">No tasks available</p>
                        <p className="text-sm">Add a new task to get started</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {tasks.map((task) => {
                            const isOverdue =
                                task.dueDate &&
                                new Date(task.dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
                                task.status !== "completed";


                            return (
                                <li
                                    key={task._id}
                                    className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <strong className={`w-full break-words text-sm sm:text-lg font-semibold text-white ${task.status === "completed" ? "line-through text-zinc-500" : ""}`}>
                                                    {task.title}
                                                </strong>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityBadge(
                                                        task.priority
                                                    )}`}
                                                    title={`Priority: ${task.priority}`}
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                                                    {task.priority}
                                                </span>

                                                {task.dueDate && (
                                                    <span className="inline-flex flex-col sm:flex-row text-xs">
                                                        <span className="inline-flex items-center gap-1 rounded-full pr-2 py-0.5 text-xs text-zinc-300">
                                                            <FiCalendar className="h-4 w-4 opacity-70" />
                                                            Due: {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                        {isOverdue && (
                                                            <span className="text-red-400 text-xs font-semibold whitespace-nowrap">
                                                                ⚠️ Due date passed!
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-2">
                                                <div
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusChip(
                                                        task.status
                                                    )}`}
                                                >
                                                    <StatusIcon s={task.status} />
                                                    {task.status === "completed"
                                                        ? "Completed"
                                                        : task.status === "inprogress"
                                                            ? "In Progress"
                                                            : "Pending"}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => deleteTask(task._id)}
                                            className="shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                                            aria-label="Delete task"
                                            title="Delete task"
                                        >
                                            <FaTrash className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="mt-3">
                                        <div className="inline-flex overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/40 sm:w-auto">
                                            {[
                                                { key: "pending", label: "Pending", Icon: FiClock },
                                                { key: "inprogress", label: "In Progress", Icon: FiPlay },
                                                { key: "completed", label: "Done", Icon: FiCheckCircle },
                                            ].map(({ key, label, Icon }) => {
                                                const active = task.status === (key as Task["status"]);
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => updateStatus(task, key as Task["status"])}
                                                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer
                                                            ${active
                                                                ? "bg-zinc-800 text-white"
                                                                : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                                                            }`}
                                                        aria-pressed={active}
                                                        title={label}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                        <span className="hidden sm:inline">{label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {showModal && (
                    <div
                        className="fixed inset-0 pl-18 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <div
                            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:p-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="mb-2 text-sm sm:text-xl font-semibold text-white">Add New Task</h2>

                            <input
                                type="text"
                                placeholder="Task title"
                                value={newTask.title}
                                onChange={(e) => {
                                    setNewTask({ ...newTask, title: e.target.value });
                                    setError("");
                                }}
                                className="mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 outline-none transition hover:border-zinc-700 focus:border-zinc-600"
                            />

                            <div className="relative">
                                <input
                                    type="date"
                                    value={newTask.dueDate || ""}
                                    onChange={(e) =>
                                        setNewTask({ ...newTask, dueDate: e.target.value })
                                    }
                                    className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                                />

                                {/* Fake placeholder */}
                                {!newTask.dueDate && (
                                    <span className="absolute left-3 top-2 text-gray-500 pointer-events-none sm:hidden">
                                        Due date
                                    </span>
                                )}
                            </div>

                            <div className="mb-4 grid grid-cols-3 gap-2">
                                {(["low", "medium", "high"] as const).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setNewTask({ ...newTask, priority: p })}
                                        className={`rounded-xl px-2 py-1 sm:px-4 sm:py-2 text-sm font-medium transition cursor-pointer
                                            ${newTask.priority === p
                                                ? "border border-zinc-700 bg-zinc-800 text-white"
                                                : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white"
                                            }`}
                                        type="button"
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {error && <p className="text-red-500 mb-2 animate-fadeInOut">{error}</p>}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="rounded-xl border border-zinc-700 px-2 py-1 sm:px-4 sm:py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addTask}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 cursor-pointer"
                                >
                                    Add Task
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}