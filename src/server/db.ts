import mongoose from "mongoose";

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
    conn: null,
    promise: null,
};

export async function connectToDB() {
    if (cached.conn) return cached.conn; // reuse connection

    if (!cached.promise) {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not defined");
        }

        cached.promise = mongoose.connect(process.env.MONGODB_URI).then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
