const dotenv = require('dotenv');
dotenv.config();
import express from 'express';
const cors=require('cors');
const app=express();
const connectDB=require('./db/db');
const userRoutes=require('./routes/user.routes');
const cookieParser=require('cookie-parser');

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use('/',userRoutes)

app.get('/',(req, res)=>{
    res.send("Hello World");
});

module.exports=app;

