import mongoose from 'mongoose';
import "dotenv/config";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL as string);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};

export default connectDB;
