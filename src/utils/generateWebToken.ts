import jwt from "jsonwebtoken"
import { RefreshToken } from "../model/refrehToken";
import crypto from "crypto"
import * as dotenv from "dotenv";
dotenv.config()

interface User {
  _id: string;
  username: string;
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}
const secret: string = process.env.JWT_SECRET;

export const generateWebToken = async (user: User) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    secret,
    {
      expiresIn: '60m',
    }
  );
  const refreshToken = crypto.randomBytes(40).toString('hex');

  let expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};
