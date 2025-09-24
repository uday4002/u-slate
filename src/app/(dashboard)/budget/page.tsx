"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Spinner from "@/components/utils/spinner";
import {
    FiPlus,
    FiTrash2,
    FiEdit,
    FiCalendar,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

// Ensure axios always sends cookies
axios.defaults.withCredentials = true;

export type BudgetEntry = {
    _id: string;
    title: string;
    amount: number;
    category: string;
    type: "income" | "expense";
    date: string;
    createdAt?: string;
    updatedAt?: string;
};

function formatDateISO(date: string | Date) {
    try {
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toISOString().split("T")[0];
    } catch {
        return "";
    }
}

function formatCurrency(num: number) {
    return num.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    });
}

export default function BudgetPage() {
    const [entries, setEntries] = useState<BudgetEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<BudgetEntry | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(""); // <-- New state for success messages

    const [form, setForm] = useState({
        title: "",
        amount: "",
        category: "",
        date: formatDateISO(new Date()),
        type: "expense",
    });

    async function fetchAll() {
        const monthsToShow = 6;
        setLoading(true);
        try {
            const res = await axios.get(`/api/budget?months=${monthsToShow}`);
            setEntries(res.data.entries || []);
            setSummary(res.data.summary || null);
            setError("");
        } catch (e) {
            console.error("Failed to fetch budget", e);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAll();
        const handleResize = () => setIsMobile(window.innerWidth < 640);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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

    const resetForm = () => {
        setForm({
            title: "",
            amount: "",
            category: "",
            date: formatDateISO(new Date()),
            type: "expense",
        });
        setError("");
        setEditing(null);
    };

    function openCreate() {
        resetForm();
        setModalOpen(true);
    }

    function onEdit(e: BudgetEntry) {
        setEditing(e);
        setForm({
            title: e.title,
            amount: String(e.amount),
            category: e.category,
            date: e.date ? formatDateISO(e.date) : formatDateISO(new Date()),
            type: e.type,
        });
        setModalOpen(true);
        setError("");
        setSuccess("");
    }

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
        setError("");
        setSuccess("");
    }

    function validateForm() {
        if (!form.title.trim() || !form.category.trim()) {
            setError("Title and category are required");
            return false;
        }
        if (Number.isNaN(Number(form.amount)) || form.amount === "") {
            setError("Enter a valid amount");
            return false;
        }
        if (!form.type) {
            setError("Select type");
            return false;
        }
        return true;
    }

    async function submitForm() {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const payload = {
                title: form.title,
                amount: Number(form.amount),
                category: form.category,
                date: form.date,
                type: form.type,
            };

            if (editing) {
                await axios.put(`/api/budget/${editing._id}`, payload);
                setSuccess("Budget entry updated successfully."); // <-- Set success message
            } else {
                await axios.post("/api/budget", payload);
                setSuccess("Budget entry added successfully."); // <-- Set success message
            }
            setModalOpen(false);
            resetForm();
            await fetchAll();
        } catch (e: any) {
            console.error("Failed submit", e);
            setError(e?.response?.data?.error || "Failed to save");
            setSuccess("");
        } finally {
            setSubmitting(false);
        }
    }

    async function onDelete(id: string) {
        if (!confirm("Are you sure you want to delete this budget entry?")) return;
        try {
            await axios.delete(`/api/budget/${id}`);
            setSuccess("Budget entry deleted successfully."); // <-- Set success message
            await fetchAll();
        } catch (e) {
            console.error("Failed delete", e);
            setError("Delete failed");
            setSuccess("");
        }
    }

    const pieData = useMemo(() => {
        if (!summary?.categories) return [];

        return summary.categories.map((c: any) => ({
            name: `${c._id.category} (${c._id.type})`,
            value: c.total,
        }));
    }, [summary]);


    const totalIncome = summary?.totals?.income ?? 0;
    const totalExpense = summary?.totals?.expense ?? 0;
    const net = summary?.totals?.balance ?? (totalIncome - totalExpense);

    const COLORS = ["#60A5FA", "#FCA5A5", "#A7F3D0", "#FDE68A", "#C7B2FF", "#FBCFE8", "#BFDBFE"];

    const barChartData = useMemo(() => {
        const thisMonthEntries = entries.filter(e => {
            const now = new Date();
            const d = new Date(e.date);
            return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
            );
        });
        const groupedData = thisMonthEntries.reduce((acc, e) => {
            if (!acc[e.category]) {
                acc[e.category] = { category: e.category, income: 0, expense: 0 };
            }
            if (e.type === "income") {
                acc[e.category].income += e.amount;
            } else {
                acc[e.category].expense += e.amount;
            }
            return acc;
        }, {} as Record<string, { category: string; income: number; expense: number }>);
        return Object.values(groupedData);
    }, [entries]);

    return (
        <div className="bg-zinc-950 min-h-screen p-4 sm:p-6 flex flex-col items-start w-full">
            {/* Header */}
            <div className="w-full flex flex-row items-center justify-between gap-3 mb-6">
                <h1 className="text-xl sm:text-4xl font-bold text-white">Budget</h1>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-2 rounded-lg text-sm sm:text-base cursor-pointer"
                >
                    <FiPlus size={18} /> Add Entry
                </button>
            </div>

            {/* Global Messages */}
            {error && <div className="w-full rounded-lg bg-red-500/20 text-red-400 p-3 mb-4 transition-opacity duration-300">{error}</div>}
            {success && <div className="w-full rounded-lg bg-green-500/20 text-green-400 p-3 mb-4 transition-opacity duration-300">{success}</div>}

            {/* Loading */}
            {loading ? (
                <Spinner />
            ) : (
                <>
                    {/* Summary Panel */}
                    <div className="w-full flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-col items-center min-w-0">
                            <div className="text-zinc-400 text-sm">Total Income</div>
                            <div className="text-green-400 text-xl font-bold text-center break-words whitespace-normal w-full overflow-hidden">
                                {formatCurrency(totalIncome)}
                            </div>
                        </div>
                        <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-col items-center min-w-0">
                            <div className="text-zinc-400 text-sm">Total Expense</div>
                            <div className="text-red-400 text-xl font-bold text-center break-words whitespace-normal w-full overflow-hidden">
                                {formatCurrency(totalExpense)}
                            </div>
                        </div>
                        <div className="flex-1 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-col items-center min-w-0">
                            <div className="text-zinc-400 text-sm">Net</div>
                            <div
                                className={`text-xl font-bold text-center break-words whitespace-normal w-full overflow-hidden ${net >= 0 ? "text-green-400" : "text-red-400"
                                    }`}
                            >
                                {formatCurrency(net)}
                            </div>
                        </div>

                    </div>


                    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Pie Chart */}
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-col items-center">
                            <div className="text-white font-semibold mb-2 text-center">Category Breakdown</div>
                            <div className="w-full h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={80}
                                            label={
                                                !isMobile
                                                    ? ({ name, value }) => `${name}`
                                                    : false
                                            }
                                            labelLine={!isMobile}
                                        >
                                            {pieData.map((_: any, idx: number) => (
                                                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                                            ))}
                                        </Pie>

                                        <Tooltip
                                            cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                            content={({ payload, label }) => {
                                                if (!payload || !payload.length) return null;

                                                const category = payload[0].payload.category;
                                                return (
                                                    <div className="bg-zinc-800 text-white p-2 rounded">
                                                        {payload.map((p: any, idx: number) => (
                                                            <div
                                                                key={p.name}
                                                            >
                                                                {p.name}: {formatCurrency(p.value ?? 0)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }}
                                        />

                                        {!isMobile && (
                                            <Legend
                                                layout="horizontal"
                                                verticalAlign="bottom"
                                                align="center"
                                                wrapperStyle={{ marginTop: 10 }}
                                            />
                                        )}
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Monthly Bar Chart */}
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-col items-center">
                            <div className="text-white font-semibold mb-2 text-center">This Month's Categories</div>
                            <div className="w-full h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barChartData}
                                        barCategoryGap="20%"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                        <XAxis dataKey="category" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <Tooltip
                                            cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;

                                                const category = payload[0].payload.category;
                                                return (
                                                    <div className="bg-zinc-800 text-white p-3 rounded-lg shadow-lg">
                                                        <div className="font-semibold text-white mb-2">{category}</div>

                                                        {payload.map((p, idx) => (
                                                            <div key={idx} className="flex justify-between gap-4 mb-1">
                                                                <span className="font-medium capitalize">{p.name}</span>
                                                                <span
                                                                    className={
                                                                        p.dataKey === "income" ? "text-green-400" : "text-red-400"
                                                                    }
                                                                >
                                                                    {formatCurrency(p.value ?? 0)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }}
                                        />

                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: "#d1d5db" }} />

                                        <Bar
                                            name="Income"
                                            dataKey="income"
                                            fill="#22c55e"
                                            barSize={isMobile ? 15 : 25}
                                        />
                                        <Bar
                                            name="Expense"
                                            dataKey="expense"
                                            fill="#f87171"
                                            barSize={isMobile ? 15 : 25}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Entry List */}
                    {entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-12 mb-8 text-zinc-400 w-full">
                            <p className="text-md sm:text-xl font-bold">No entries found</p>
                            <p className="text-sm sm:text-base mt-1 text-center">
                                Add income or expenses to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                            {entries.map((e) => (
                                <div
                                    key={e._id}
                                    className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-md hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-zinc-800/70">
                                            <FaRupeeSign className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-semibold text-base break-words">{e.title}</div>
                                            <div className="text-zinc-400 text-sm break-words">{e.category}</div>
                                            <div className={`text-sm mt-2 break-words ${e.type === "income" ? "text-green-400" : "text-red-400"}`}>
                                                {(e.type === "income" ? "+" : "-")}{formatCurrency(Math.abs(e.amount))}
                                            </div>
                                            <div className="text-zinc-400 text-xs mt-1">
                                                <FiCalendar className="inline-block mr-1" />
                                                {formatDateISO(e.date)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-3">
                                        <button
                                            onClick={() => onEdit(e)}
                                            className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600 transition text-sm sm:text-base cursor-pointer"
                                        >
                                            <FiEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(e._id)}
                                            className="flex items-center gap-1 text-red-500 hover:text-red-600 transition text-sm sm:text-base cursor-pointer"
                                        >
                                            <FiTrash2 /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
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
                            {editing ? "Update Entry" : "Add Entry"}
                        </h2>

                        <input
                            name="title"
                            value={form.title}
                            onChange={onChange}
                            placeholder="Title..."
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none"
                        />

                        <input
                            name="amount"
                            value={form.amount}
                            onChange={onChange}
                            placeholder="Amount"
                            type="number"
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none
                            [&::-webkit-inner-spin-button]:appearance-none
                            [&::-webkit-outer-spin-button]:appearance-none
                            [&::-webkit-clear-button]:appearance-none"
                        />

                        <input
                            name="category"
                            value={form.category}
                            onChange={onChange}
                            placeholder="Category"
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 outline-none"
                        />

                        <input
                            name="date"
                            value={form.date}
                            onChange={onChange}
                            type="date"
                            className="p-2 mb-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-clear-button]:appearance-none"
                        />

                        <select
                            name="type"
                            value={form.type}
                            onChange={onChange}
                            className="p-2 mb-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 text-white outline-none"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </select>
                        {error && <p className="text-red-500 mb-2">{error}</p>}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setModalOpen(false);
                                    setEditing(null);
                                }}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitForm}
                                disabled={submitting}
                                className="sm:text-base text-sm px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                            >
                                {submitting ? (editing ? "Updating..." : "Adding...") : editing ? "Update" : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}