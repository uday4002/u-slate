"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
    FiBookOpen,
    FiCheckSquare,
    FiFolder,
    FiAward,
    FiTarget,
    FiZap,
    FiClock,
    FiEdit
} from "react-icons/fi";
import { HiFire } from "react-icons/hi";
import { FaRupeeSign } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useRouter } from "next/navigation";
import Spinner from "@/components/utils/spinner";

// TYPES 
type Journal = { _id: string; title: string; date?: string };

type Task = {
    _id: string;
    title: string;
    dueDate?: string;
    status: "pending" | "inprogress" | "completed";
    priority: "low" | "medium" | "high";
};

type BudgetEntry = {
    _id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    type: "income" | "expense";
};

type summary = {
    totals: { income: number; expense: number; balance: number };
}

type Budget = { entries: BudgetEntry[], summary: summary };

type LearningHabit = {
    _id: string;
    title: string;
    frequency: "daily" | "weekly";
    target: number;
    streak: number;
    xp: number;
};

// Colors for the task chart and other components
const COLORS = {
    completed: "#4ade80",
    pending: "#f87171",
    inprogress: "#facc15"
};

export default function DashboardPage() {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [budget, setBudget] = useState<Budget | null>(null);
    const [learningHabits, setLearningHabits] = useState<LearningHabit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [taskFilter, setTaskFilter] = useState<"today" | "week" | "all">("today");
    const [projectsCount, setProjectsCount] = useState(0);
    const [certificationsCount, setCertificationsCount] = useState(0);

    const router = useRouter();

    // FETCH DASHBOARD DATA 
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [journalRes, taskRes, projectRes, certRes, budgetRes, habitsRes] = await Promise.all([
                axios.get("/api/journal"),
                axios.get("/api/tasks"),
                axios.get("/api/projects"),
                axios.get("/api/certifications"),
                axios.get("/api/budget"),
                axios.get("/api/learninghabit"),
            ]);

            setJournals(Array.isArray(journalRes.data) ? journalRes.data.slice(0, 5) : []);
            setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
            setProjectsCount(Array.isArray(projectRes.data) ? projectRes.data.length : 0);
            setCertificationsCount(Array.isArray(certRes.data) ? certRes.data.length : 0);
            setBudget(budgetRes.data || { entries: [] });
            setLearningHabits(habitsRes.data || []);
            setError("");
        } catch (err) {
            console.error(err);
            setError("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading)
        return (
            <div className="flex justify-center items-center min-h-screen bg-zinc-950">
                <Spinner />
            </div>
        );

    if (error) return <p className="text-red-400 text-center mt-10">{error}</p>;

    // TASK CHART 
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const inProgressTasks = tasks.filter((t) => t.status === "inprogress").length;
    const taskChartData = [
        { name: "Completed", value: completedTasks, color: COLORS.completed },
        { name: "Pending", value: pendingTasks, color: COLORS.pending },
        { name: "In Progress", value: inProgressTasks, color: COLORS.inprogress },
    ];

    // Filter upcoming tasks
    const today = new Date();
    const upcomingTasks = tasks.filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        if (taskFilter === "today") return due.toDateString() === today.toDateString();
        if (taskFilter === "week") {
            const diffDays = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays >= 0 && diffDays <= 7;
        }
        return true;
    });

    // calculate budget summary
    const totalIncome = budget?.summary?.totals?.income ?? 0;
    const totalExpense = budget?.summary?.totals?.expense ?? 0;
    const budgetValue = budget?.summary?.totals?.balance ?? (totalIncome - totalExpense);

    const budgetProgress = totalIncome !== 0 ? Math.min(Math.max((totalExpense / totalIncome) * 100, 0), 100) : 0;

    let progressColor = "bg-green-500";
    if (budgetProgress > 75) progressColor = "bg-red-500";
    else if (budgetProgress > 50) progressColor = "bg-orange-400";

    const amountColor = budgetValue >= 0 ? "text-green-400" : "text-red-400";

    // Calculate learning habit stats 
    const totalHabits = learningHabits.length;
    const totalStreak = learningHabits.reduce((sum, h) => sum + h.streak, 0);
    const totalXP = learningHabits.reduce((sum, h) => sum + h.xp, 0);

    // TASK CLICKABLE CARD
    function TaskClickableCard({
        tasks,
        onClick,
    }: {
        tasks: { completed: number; pending: number; inprogress: number; };
        onClick: () => void;
    }) {
        const totalTasks = tasks.completed + tasks.pending + tasks.inprogress;

        return (
            <div
                onClick={onClick}
                className="bg-zinc-900 p-6 rounded-2xl flex flex-col items-start gap-2 shadow-lg hover:shadow-2xl transition cursor-pointer w-full"
            >
                <div className="flex gap-4 items-center">
                    <FiCheckSquare size={32} className="text-green-500" />
                    <p className="text-2xl font-bold">{totalTasks}</p>
                    <p className="text-zinc-400">Tasks</p>
                </div>
                <div className="flex flex-col gap-1 mt-2 w-full">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-green-400">
                            <FiCheckSquare size={16} />
                            <span>Completed</span>
                        </div>
                        <span className="font-semibold">{tasks.completed}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-yellow-400">
                            <FiEdit size={16} />
                            <span>In Progress</span>
                        </div>
                        <span className="font-semibold">{tasks.inprogress}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1 text-red-400">
                            <FiClock size={16} />
                            <span>Pending</span>
                        </div>
                        <span className="font-semibold">{tasks.pending}</span>
                    </div>
                </div>
            </div>
        );
    }

    // RECENT SECTION 
    function RecentSection({
        title,
        items,
        field,
        dateField,
        completedField,
    }: {
        title: string;
        items: any[];
        field: string;
        dateField?: string;
        completedField?: string;
    }) {
        const getBgColor = (status: "completed" | "pending" | "inprogress") => {
            switch (status) {
                case "completed":
                    return "bg-green-700";
                case "pending":
                    return "bg-red-700";
                case "inprogress":
                    return "bg-yellow-700";
                default:
                    return "bg-zinc-800";
            }
        };

        return (
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 ">{title}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.length === 0 ? (
                        <p className="text-zinc-400 col-span-full">No items available</p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={item._id}
                                className={`p-4 rounded-2xl shadow-md hover:shadow-lg flex justify-between items-center gap-2 text-sm sm:text-md ${completedField ? getBgColor(item[completedField]) : "bg-zinc-800"}`}
                            >
                                <div
                                    className={`flex-1 min-w-0 break-words whitespace-normal ${completedField && item[completedField] === "completed"
                                        ? "line-through text-zinc-200"
                                        : "text-white font-semibold"
                                        }`}
                                >
                                    {item[field]}
                                </div>


                                {dateField && item[dateField] && (
                                    <span className="text-zinc-200 text-[12px] whitespace-nowrap">
                                        {new Date(item[dateField]).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-zinc-950 min-h-screen p-4 sm:p-12 text-white">
            <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500">
                Dashboard
            </h1>
            <p className="text-zinc-400 mb-8 text-lg">
                Your personal hub for tracking your college life.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg transition hover:shadow-2xl col-span-full">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-400">
                        <FiTarget size={32} /> Learning Habits Summary
                    </h2>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="flex flex-col items-center flex-1 text-center bg-zinc-800 p-4 rounded-xl">
                            <span className="text-3xl font-bold">{totalHabits}</span>
                            <span className="text-zinc-400 text-sm">Total Habits</span>
                        </p>
                        <div className="flex flex-col items-center flex-1 text-center bg-zinc-800 p-4 rounded-xl">
                            <p className="flex items-center gap-1">
                                <span className="text-3xl font-bold">{totalStreak}</span>
                                <HiFire size={26} color="#FF5722" />
                            </p>
                            <span className="text-zinc-400 text-sm">Combined Streak</span>
                        </div>
                        <p className="flex flex-col items-center flex-1 text-center bg-zinc-800 p-4 rounded-xl">
                            <span className="text-3xl font-bold flex items-center gap-1">{totalXP} <FiZap className="text-yellow-400" size={24} /> </span>
                            <span className="text-zinc-400 text-sm">Total XP Earned</span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <TaskClickableCard
                    tasks={{ completed: completedTasks, pending: pendingTasks, inprogress: inProgressTasks }}
                    onClick={() => router.push("/tasks")}
                />
                <div
                    onClick={() => router.push("/budget")}
                    className="bg-zinc-900 p-6 rounded-2xl flex flex-col items-start gap-2 shadow-lg hover:shadow-2xl transition cursor-pointer w-full"
                >
                    <FaRupeeSign size={32} className="text-red-500" />
                    <div className="flex gap-2 items-center mt-2 min-w-0 w-full">
                        <div
                            className={`text-2xl font-bold break-words whitespace-normal overflow-hidden text-ellipsis flex-1 ${amountColor}`}
                            title={budgetValue.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                            })}
                        >
                            {budgetValue.toLocaleString("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 0,
                            })}
                        </div>
                    </div>

                    {budgetProgress !== undefined && (
                        <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                            <div
                                className={`${progressColor} h-2 rounded-full transition`}
                                style={{ width: `${budgetProgress}%` }}
                            />
                        </div>
                    )}
                    {budgetValue < 0 && <p className="text-red-400 mt-1 text-sm">⚠ Reached budget limit</p>}
                </div>
                <div
                    onClick={() => router.push("/journals")}
                    className="bg-zinc-900 p-6 rounded-2xl flex flex-col items-start gap-2 shadow-lg hover:shadow-2xl transition cursor-pointer w-full"
                >
                    <FiBookOpen size={32} className="text-blue-500" />
                    <div className="flex gap-2 items-center mt-2">
                        <p className="text-2xl font-bold">{journals.length}</p>
                        <p className="text-zinc-400">Journals</p>
                    </div>
                </div>
                <div
                    onClick={() => router.push("/projects")}
                    className="bg-zinc-900 p-6 rounded-2xl flex flex-col items-start gap-2 shadow-lg hover:shadow-2xl transition cursor-pointer w-full"
                >
                    <FiFolder size={32} className="text-yellow-500" />
                    <div className="flex gap-2 items-center mt-2">
                        <p className="text-2xl font-bold">{projectsCount}</p>
                        <p className="text-zinc-400">Projects</p>
                    </div>
                </div>
                <div
                    onClick={() => router.push("/certifications")}
                    className="bg-zinc-900 p-6 rounded-2xl flex flex-col items-start gap-2 shadow-lg hover:shadow-2xl transition cursor-pointer w-full"
                >
                    <FiAward size={32} className="text-purple-500" />
                    <div className="flex gap-2 items-center mt-2">
                        <p className="text-2xl font-bold">{certificationsCount}</p>
                        <p className="text-zinc-400">Certifications</p>
                    </div>
                </div>
            </div>

            <hr className="border-zinc-800 mb-8" />
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Task Chart */}
                <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg transition hover:shadow-2xl">
                    <h2 className="text-xl font-semibold mb-4">Task Completion</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={taskChartData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={80}
                            >
                                {taskChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ payload, }) => {
                                    if (!payload || !payload.length) return null;
                                    return (
                                        <div className="bg-zinc-800 text-white p-2 rounded-lg shadow-md">
                                            {payload.map((p: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>{p.name}: {p.value} tasks</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }}
                            />
                            <Legend wrapperStyle={{
                                fontSize: window.innerWidth < 500 ? 12 : 18,
                                paddingTop: 8,
                                textAlign: 'center'
                            }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Upcoming Tasks */}
                <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg transition hover:shadow-2xl">
                    <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => setTaskFilter("today")}
                            className={`px-3 py-1 rounded-full text-sm cursor-pointer ${taskFilter === "today" ? "bg-blue-600" : "bg-zinc-800"}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setTaskFilter("week")}
                            className={`px-3 py-1 rounded-full text-sm cursor-pointer ${taskFilter === "week" ? "bg-blue-600" : "bg-zinc-800"}`}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setTaskFilter("all")}
                            className={`px-3 py-1 rounded-full text-sm cursor-pointer ${taskFilter === "all" ? "bg-blue-600" : "bg-zinc-800"}`}
                        >
                            All
                        </button>
                    </div>

                    {upcomingTasks.length === 0 ? (
                        <p className="text-zinc-400">No tasks found</p>
                    ) : (
                        <ul className="space-y-2 max-h-80 overflow-y-auto">
                            {upcomingTasks.map((t) => {
                                const due = new Date(t.dueDate!);
                                const todayDate = new Date();
                                todayDate.setHours(0, 0, 0, 0);
                                const dueDateOnly = new Date(due);
                                dueDateOnly.setHours(0, 0, 0, 0);

                                const isOverdue = t.status !== "completed" && dueDateOnly < todayDate;

                                return (
                                    <li
                                        key={t._id}
                                        className={`p-3 rounded-lg flex justify-between items-center **gap-4** ${isOverdue ? "bg-red-700" : "bg-zinc-800"}`}
                                    >
                                        <span
                                            className={`**flex-1** break-words ${t.status === "completed" ? "line-through text-zinc-400" : "text-white font-semibold"} text-[12px] sm:text-sm`}
                                        >
                                            {t.title}
                                        </span>
                                        <span className="text-[11px] sm:text-sm whitespace-nowrap">{due.toLocaleDateString()}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <hr className="border-zinc-800 mb-8" />
            <RecentSection
                title="Recent Tasks"
                items={tasks.slice(0, 5)}
                field="title"
                dateField="dueDate"
                completedField="status"
            />
            <RecentSection title="Recent Journals" items={journals.slice(0, 5)} field="title" dateField="date" />
        </div>
    );
}