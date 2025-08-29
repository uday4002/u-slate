import { Schema, Types, model, models } from "mongoose";

export interface ICertification {
    name: string;
    organisation: string;
    certificateId?: string;
    url?: string;
    issuedDate?: Date;
    user: Types.ObjectId; // reference to User
    createdAt?: Date;
    updatedAt?: Date;
}

const CertificationSchema = new Schema<ICertification>(
    {
        name: { type: String, required: true, trim: true },
        organisation: { type: String, required: true, trim: true },
        certificateId: { type: String, trim: true },
        url: { type: String, trim: true },
        issuedDate: { type: Date },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

const Certification =
    models.Certification || model<ICertification>("Certification", CertificationSchema);

export default Certification;
