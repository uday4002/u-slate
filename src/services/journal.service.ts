import Journal, { IJournal } from "@/server/models/Journal";
import { HydratedDocument, Types } from "mongoose";

// Type for a full Mongoose journal document
export type JournalDocument = HydratedDocument<IJournal>;

// CREATE JOURNAL
export const createJournal = async (
    data: Partial<IJournal>
): Promise<JournalDocument> => {
    const journal = new Journal(data);
    return await journal.save();
};

// GET JOURNALS BY USER
export const getJournalsByUser = async (
    userId: string
): Promise<JournalDocument[]> => {
    return await Journal.find({ user: userId })
        .sort({ createdAt: -1 })
        .exec();
};

// UPDATE JOURNAL
export const updateJournal = async (
    id: string,
    data: Partial<IJournal>,
    userId: string | Types.ObjectId
): Promise<JournalDocument | null> => {
    return await Journal.findOneAndUpdate(
        { _id: id, user: userId },
        data,
        { new: true }
    ).exec();
};

export const deleteJournal = async (
    id: string,
    userId: string | Types.ObjectId
): Promise<JournalDocument | null> => {
    return await Journal.findOneAndDelete({ _id: id, user: userId }).exec();
};
