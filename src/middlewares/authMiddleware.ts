import jwt from "jsonwebtoken"
import { apierror } from "../utils/ApiError";
import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import "../types/express"; // Import the extended Request interface



export const protect = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log(token)
    if (!token) {
        logger.error("Not authorized, no token");
        return next(new apierror("Not authorized, no token", 401));
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            logger.error("JWT secret is not defined");
            return next(new apierror("Internal server error", 500));
        }
        jwt.verify(token, secret, (err, info)=>{
            if(err){
                logger.error("Unauthorized. invalid Token")
                return next(new apierror('Unauthorized. invalid Token', 403))
            }
        req.user = info as jwt.JwtPayload;

    next()})
    } catch (error) {
        return next(new apierror("Not authorized, token failed", 401));
    }
};

export const admin = async (req: Request, res: Response, next: NextFunction)=> {
    if (req.user && (req.user as jwt.JwtPayload).role === 'Admin') {
        next();
    } else {
        return next(new apierror("Not authorized as admin", 403));
    }
};
