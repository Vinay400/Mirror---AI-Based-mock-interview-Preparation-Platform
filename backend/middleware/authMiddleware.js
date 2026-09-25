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
    const User = await user.findById(decoded.userId).select("-password +passwordChangedAt");

    if(!User){
        return res.status(401).json({
            message: "User not found."
        });
    }

    //5. Reject tokens issued before the current password was set, so a password
    // reset actually ends existing sessions (including 30-day "remember me"
    // tokens). decoded.iat is in whole seconds, so allow a one-second grace or a
    // token minted in the same second as the change would reject itself.
    if(
        User.passwordChangedAt &&
        decoded.iat * 1000 < new Date(User.passwordChangedAt).getTime() - 1000
    ){
        return res.status(401).json({
            message: "Password changed. Please sign in again."
        });
    }

    //6. Attach user to request
    req.user = User;

    //7. Continue
    next();
    } catch(err){
        console.error("Auth Middleware Error:", err);
        res.status(401).json({
            message: "Invalid or expired token."
        });
    }
};
export default protect;