import mongoose from "mongoose";
import { logger } from "../utils/logger";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  logger.error('MongoDB URI is not defined');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => logger.info('Connected to MongoDB database'))
  .catch((e) => logger.error('Mongo connection error', e));
