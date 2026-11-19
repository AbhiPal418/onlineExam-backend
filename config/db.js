// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// dotenv.config();


// const connectDB = async () => {
//     try {
//         const conn = await mongoose.connect(`${process.env.MONGO_URI}/onlineExam`);
//         console.log(`MongoDB Connected: ${conn.connection.host}`);
//     } catch (error) {
//         console.error('Error connecting to MongoDB:', error);
//         process.exit(1);
//     }
// };

// export default connectDB;



import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let cached = globalThis.mongoose;

if (!cached) {
    cached = globalThis.mongoose = {
        conn: null,
        promise: null
    };
}

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing from environment variables");
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 0) {
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(
            `${process.env.MONGO_URI}/onlineExam`,
            {
                serverSelectionTimeoutMS: 10000
            }
        ).then((connection) => {
            console.log(
                `MongoDB Connected: ${connection.connection.host}`
            );

            return connection;
        }).catch((error) => {
            cached.promise = null;
            cached.conn = null;
            throw error;
        });
    }

    cached.conn = await cached.promise;

    return cached.conn.connection;
};

export default connectDB;
