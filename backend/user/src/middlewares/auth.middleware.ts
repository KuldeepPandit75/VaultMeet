import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import BlacklistToken from '../models/blacklistToken.model.js';

interface JwtPayload {
  _id: string;
}

const authMiddleware = async (req:any, res:any, next:any) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const isBlacklisted = await BlacklistToken.findOne({token});
  
  if(isBlacklisted) {
    return res.status(401).json({message:"Unauthorized"});
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default authMiddleware;

