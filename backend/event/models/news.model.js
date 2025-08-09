import mongoose from "mongoose";

const newsSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    imageUrl:{
        type:String,
        required:true
    },
    source:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    link:{
        type:String,
        required:true
    }
})

const News=mongoose.model("News",newsSchema)

export default News;