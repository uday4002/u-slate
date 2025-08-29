import Budget, { IBudget } from "@/server/models/Budget";
import { Types } from "mongoose";

// GET all budgets for a user
export async function getBudgetsByUser(userId: string) {
    return Budget.find({ user: new Types.ObjectId(userId) }).sort({ date: -1 }).lean();
}

// Create a new entry
export async function createBudgetEntry(data: {
    title: string;
    amount: number;
    category: string;
    date: Date | string;
    type: "income" | "expense";
    user: string;
}) {
    const budget = new Budget({
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: new Date(data.date),
        type: data.type,
        user: new Types.ObjectId(data.user),
    });

    const doc = await budget.save();
    return doc.toObject();

}

// Update an entry
export async function updateBudgetEntry(id: string, userId: string, patch: Partial<IBudget>) {
    const doc = await Budget.findOneAndUpdate(
        { _id: id, user: new Types.ObjectId(userId) },
        { $set: patch },
        { new: true }
    ).lean();
    return doc;
}

// Delete an entry
export async function deleteBudgetEntry(id: string, userId: string) {
    const res = await Budget.deleteOne({ _id: id, user: new Types.ObjectId(userId) });
    return res.deletedCount === 1;
}

// Get budget summary: monthly aggregation, category totals, overall totals
export async function getBudgetSummary(userId: string, months = 6) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    // Monthly aggregation
    const monthly = await Budget.aggregate([
        { $match: { user: new Types.ObjectId(userId), date: { $gte: start } } },
        {
            $group: {
                _id: { year: { $year: "$date" }, month: { $month: "$date" } },
                income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
                expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
            },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Category totals (all time for this user)
    const categories = await Budget.aggregate([
        { $match: { user: new Types.ObjectId(userId) } },
        {
            $group: {
                _id: { category: "$category", type: "$type" },
                total: { $sum: "$amount" },
            },
        },
        { $sort: { total: -1 } },
    ]);

    // Totals (income / expense / balance)
    const totals = await Budget.aggregate([
        { $match: { user: new Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$type",
                total: { $sum: "$amount" },
            },
        },
    ]);

    const summaryTotals = { income: 0, expense: 0, balance: 0 };
    totals.forEach((t: any) => {
        if (t._id === "income") summaryTotals.income = t.total;
        if (t._id === "expense") summaryTotals.expense = t.total;
    });
    summaryTotals.balance = summaryTotals.income - summaryTotals.expense;

    return { monthly, categories, totals: summaryTotals };
}
