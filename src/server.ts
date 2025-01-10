import express, { Application } from "express";
import { Request, Response, NextFunction } from "express-serve-static-core";
import * as dotenv from "dotenv";
import { logger } from "./utils/logger";
import authrouter from  './routes/authroutes'

dotenv.config()
const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;


app.use((req: Request, res: Response, next:NextFunction) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
    next();
});

app.use("/api/v1/Ecommerce/users", authrouter)

app.listen(PORT, ()=>{
    logger.info(`Ecommerce is running on port ${PORT}`);
})
