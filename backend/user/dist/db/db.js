import mongoose from 'mongoose';
export function connectDB() {
    mongoose.connect(process.env.MONGO_URL || '')
        .then(() => {
        console.log("Connected to MongoDB");
    })
        .catch((err) => {
        console.log(err);
    });
}
