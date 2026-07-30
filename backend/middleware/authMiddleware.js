import express from 'express';
import generateToken from '../utils/generateToken.js';
import user from '../models/User.js';
import jwt from "jsonwebtoken";
const protect = async(req, res, next) =>{
    try{
        // 1. Check if Authorization header exists
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message: "Not Authorized. No token provided."
        });
    }
    //2. Extract token
    const token = authHeader.split(" ")[1];

    //3. Verify JWT
    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    //4. User Fininding
    const User = await user.findById(decoded.userId).select("-password");

    if(!User){
        return res.status(401).json({
            message: "User not found."
        });
    }
    //5. Attach user to request
    req.user = User;

    //6. Continue
    next();
    console.log(process.env.JWT_SECRET);
    } catch(err){
        console.error("Auth Middleware Error:", err);
        res.status(401).json({
            message: "Invalid or expired token."
        });
    }
};
export default protect;