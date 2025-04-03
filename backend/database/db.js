import mongoose from "mongoose"
import 'dotenv/config';


const connection =async ()=>{
    const username=process.env.MBD_USERNAME;
    const password=process.env.MBD_PASSWORD;
    try{
        await mongoose.connect(`mongodb+srv://${username}:${password}@cluster1.rbtvmid.mongodb.net/D-ARK?retryWrites=true&w=majority&appName=Cluster1`);
        console.log("Database connected Succesfully!")
    }catch(error){
        console.log("Error while connecting to the database", error);
    }
}

export default connection;