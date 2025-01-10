import express, { Router, Request, Response } from 'express';
import { registerUser, loginUser, logoutUser, refreshTokenUser } from "../controllers/userController"
const router: Router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh-token', refreshTokenUser)
router.post('/logout', logoutUser)

export default router
