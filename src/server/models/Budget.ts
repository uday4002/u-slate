import { Schema, Types, model, models } from "mongoose";

export interface IBudget {
    title: string;
    amount: number;
    category: string;
    date: Date;
    type: "income" | "expense";
    user: Types.ObjectId; // reference to User
    createdAt?: Date;
    updatedAt?: Date;
}

const BudgetSchema = new Schema<IBudget>(
    {
        title: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        category: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        type: { type: String, enum: ["income", "expense"], required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true }
);

const Budget = models.Budget || model<IBudget>("Budget", BudgetSchema);
export default Budget;
