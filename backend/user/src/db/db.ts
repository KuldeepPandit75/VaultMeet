import mongoose from 'mongoose';

function connectDB(){
    mongoose.connect(process.env.MONGO_URL as string)
    .then(()=>{
        console.log("Connected to MongoDB");
    })
    .catch((err)=>{
        console.log(err);
    });
}
module.exports=connectDB;
