const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");
const BlacklistToken = require("../models/blacklistToken.model");

module.exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, password, role } = req.body;

  console.log(req.body);

  const hashedPassword = await userModel.hashPassword(password);

  const user = await userService.createUser({
    fullname:{
        firstname:fullname.firstname,
        lastname:fullname.lastname,
    },
    email,
    password: hashedPassword,
    role,
  });

  const token= user.generateAuthToken();


  res.status(201).json({token, user});
};

module.exports.loginUser=async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }

    const {email,password}=req.body;

    const user=await userModel.findOne({email}).select('+password');

    if(!user){
        return res.status(401).json({message:"Invalid email or password"});
    }

    const isMatch=await user.comparePassword(password);

    if(!isMatch){
        return res.status(401).json({message:"Invalid email or password"});
    }

    const token=user.generateAuthToken();

    res.cookie('token',token);

    res.status(200).json({token,user});
}

module.exports.getUserProfile=async(req,res)=>{
    const user=await userModel.findById(req.user._id);
    if(!user){
        return res.status(404).json({message:"User not found"});
    }
    res.status(200).json({user});
}

module.exports.logoutUser=async(req,res)=>{
    res.cookie('token', '', {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'strict' 
    });

    const token=req.cookies.token || req.headers.authorization?.split(" ")[1];

    await BlacklistToken.create({token});

    res.status(200).json({message:"Logged out successfully"});
}