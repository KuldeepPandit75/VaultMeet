const userModel=require('../models/user.model');

module.exports.createUser=async({fullname,email,password,role}:{fullname:{firstname:string,lastname:string},email:string,password:string,role:string})=>{
 if(!fullname || !email || !password ){
    throw new Error("All fields are required");
 }

 const user=userModel.create({
    fullname:{
        firstname:fullname.firstname,
        lastname:fullname.lastname,
    },
    email,
    password,
    role,
 })

 return user;
}