import { Types, HydratedDocument } from "mongoose";
import PublicProfile, { IPublicProfile, PlatformKey } from "@/server/models/PublicProfile";
import { detectPlatformFromUrl, normalizeUrl } from "@/server/utils";

// Type for a full Mongoose PublicProfile document
export type PublicProfileDocument = HydratedDocument<IPublicProfile>;

// CREATE PUBLIC PROFILE
export const createPublicProfile = async (
    userId: string | Types.ObjectId,
    data: Partial<IPublicProfile>
): Promise<PublicProfileDocument> => {
    const platform: PlatformKey = data.platform || detectPlatformFromUrl(data.url || "") || "custom";
    const url = normalizeUrl(data.url || "");

    const profile = new PublicProfile({
        user: new Types.ObjectId(userId),
        platform,
        name: data.name?.trim(),
        username: data.username?.trim(),
        url,
    });

    return await profile.save();
};

// GET PUBLIC PROFILES BY USER
export const getPublicProfilesByUser = async (
    userId: string | Types.ObjectId
): Promise<PublicProfileDocument[]> => {
    return await PublicProfile.find({ user: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .exec();
};

// UPDATE PUBLIC PROFILE
export const updatePublicProfile = async (
    id: string,
    userId: string | Types.ObjectId,
    data: Partial<IPublicProfile>
): Promise<PublicProfileDocument | null> => {
    const update: Partial<IPublicProfile> = {};

    if (data.name !== undefined) update.name = data.name.trim();
    if (data.username !== undefined) update.username = data.username.trim();
    if (data.url !== undefined) update.url = normalizeUrl(data.url);
    if (data.platform !== undefined) update.platform = data.platform;

    // Auto-detect platform if not provided but URL changed
    if (!update.platform && data.url) {
        update.platform = detectPlatformFromUrl(update.url!) || "custom";
    }

    return await PublicProfile.findOneAndUpdate(
        { _id: id, user: userId },
        { $set: update },
        { new: true }
    ).exec();
};

// DELETE PUBLIC PROFILE
export const deletePublicProfile = async (
    id: string,
    userId: string | Types.ObjectId
): Promise<PublicProfileDocument | null> => {
    return await PublicProfile.findOneAndDelete({
        _id: id,
        user: new Types.ObjectId(userId),
    }).exec();
};

