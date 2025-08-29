import Certification, { ICertification } from "@/server/models/Certification";
import { HydratedDocument, Types } from "mongoose";

// Type for a full Mongoose certification document
export type CertificationDocument = HydratedDocument<ICertification>;

// CREATE CERTIFICATION
export const createCertification = async (
    data: Partial<ICertification>
): Promise<CertificationDocument> => {
    const certification = new Certification(data);
    return await certification.save();
};

// GET CERTIFICATIONS BY USER
export const getCertificationsByUser = async (
    userId: string | Types.ObjectId
): Promise<CertificationDocument[]> => {
    return await Certification.find({ user: userId })
        .sort({ createdAt: -1 })
        .exec();
};

// UPDATE CERTIFICATION
export const updateCertification = async (
    id: string,
    data: Partial<ICertification>,
    userId: string | Types.ObjectId
): Promise<CertificationDocument | null> => {
    return await Certification.findOneAndUpdate(
        { _id: id, user: userId },
        data,
        { new: true }
    ).exec();
};

// DELETE CERTIFICATION
export const deleteCertification = async (
    id: string,
    userId: string | Types.ObjectId
): Promise<CertificationDocument | null> => {
    return await Certification.findOneAndDelete({ _id: id, user: userId }).exec();
};
