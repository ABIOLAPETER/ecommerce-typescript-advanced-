import { logger } from "../utils/logger";
import { User,invalidateResetToken} from "../model/userModel";
import { generateWebToken } from "../utils/generateWebToken";
import { validateReg } from "../utils/validate";
import { validateLogin } from "../utils/validate";
import { Request, Response, NextFunction } from "express";
import { RefreshToken } from "../model/refrehToken";
import crypto from "crypto";
import {sendPasswordResetEmail, sendPasswordResetSuccess, sendWelcomeEmail, sendRoleChangeEmail, sendVerificationEmail, } from "../email-configuration/emails";
import { JwtPayload } from 'jsonwebtoken';

import argon2 from 'argon2';



// User Controller=> Handles user-related operations
// - Register a new user
// - Login and authentication
// - Get user profile
// - Update user details (e.g., address, phone number)
// - Admin: Get all users, delete a user
// - Forgot password and reset password



export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Registration EndPoint');
      const { error } = validateReg(req.body);

      if (error) {
          logger.warn('Validation error', error.details[0].message);
          res.status(400).json({
            success: false,
            message: error.details[0].message,
          });
          return;
        }

      const { email, password, username } = req.body;
      let user = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (user) {
        logger.warn('User already exists');
          res.status(400).json({
          success: false,
          message: 'User with this email or username already exists',
        });
        return;
      }

      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

      user = new User({
          username,
          email,
          password,
          verificationToken,
          verificationTokenExpiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
        });

        const adminEmail = process.env.ADMIN_EMAIL;
        if (user.email === adminEmail) {
          user.role = 'Admin';
        }

    if (user.verificationToken) {
        await sendVerificationEmail(user.email, user.verificationToken);
    } else {
        throw new Error('Verification token is undefined');
    }

      await user.save();
      logger.info('User saved successfully', user._id);
      const { accessToken, refreshToken } = await generateWebToken({
        ...user.toObject(),
        _id: user._id.toString(),
      });

      res.status(201).json({
        success: true,
        message: 'User registration successful',
        User:{
                ...user,
                password: undefined // Exclude password from response
            }

      });
    } catch (e) {
      logger.error('Registration error occurred', e);
      next(e); // Pass the error to the next middleware for proper error handling
    }
};

// VERIFY EMAIL //////////////////////////////////////
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    logger.warn('Verify Email Endpoint Hit.....');
    const { code } = req.body; // Get verification code from request body
    try {
        // Find user by verification token and ensure it hasn't expired
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        });

        if (!user) { // If no matching user, return an error
            logger.error('Invalid or expired verification code');
            return res.status(400).json({
                message: 'Invalid or expired verification code',
                status: 'fail'
            });
        }

        // Mark the user as verified, clear the verification token and expiration
        user.isverified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save(); // Save changes

        // Send welcome email after successful verification
        await sendWelcomeEmail(user.email, user.username);

        return res.status(200).json({
            message: 'Email verified successfully',
            status: 'success',
            User: {
                ...user,
                password: undefined // Exclude password from response
            }
        });
    } catch (error) {
        logger.error('Error verifying email:', error);
        res.status(500).json({
            message: 'Server error, please try again later',
            status: 'fail'
        });
        next(error);
    }
};



export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Login Endpoint Hit............');

    try {
      const { error } = validateLogin(req.body);
      if (error) {
        logger.warn('Validation error', error.details[0].message);
        res.status(400).json({
          success: false,
          message: error.details[0].message,
        });

        return;
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('User not found in the database');
        res.status(400).json({
          success: false,
          message: 'Invalid email',
        });
        return;
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        logger.warn('Invalid Password');
        res.status(400).json({
          success: false,
          message: 'Invalid Password',
        });
        return;
      }

      const { accessToken, refreshToken } = await generateWebToken({
        ...user.toObject(),
        _id: user._id.toString(),
      });

      if(user.isverified === false){
        logger.warn('User not verified');
        res.status(400).json({
          success: false,
          message: 'User not verified',
        });
        return;
      }
      user.lastLogin = new Date();
        await user.save();
      res.status(200).json({
        success: true,
        message: 'Login successful',
        refreshToken,
        accessToken,
        userId: user._id,
      });
    } catch (e) {
      logger.error('Login error occurred', e);
      next(e); // Pass the error to the next middleware for proper error handling
    }
}



export const refreshTokenUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Refresh Token Endpoint Hit.....');

    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        logger.error('Refresh Token Missing');
        res.status(400).json({
          success: false,
          message: 'Refresh Token Missing',
        });

        return;
      }

      const storedToken = await RefreshToken.findOne({ token: refreshToken });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        logger.error('Refresh Token Expired or Invalid');
        res.status(400).json({
          success: false,
          message: 'Refresh Token Expired or Invalid',
        });

        return;
      }

      const user = await User.findById(storedToken.user);
      if (!user) {
        logger.error('User Not Found');
        res.status(400).json({
          success: false,
          message: 'User Not Found',
        });

        return;
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await generateWebToken({ ...user.toObject(), _id: user._id.toString() });

      await RefreshToken.deleteOne({ _id: storedToken._id });

      res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (e) {
      logger.error('Refresh Token error occurred', e);
      next(e); // Pass the error to the next middleware for proper error handling
    }
}

// LOGOUT //////////////////////////////////////
export const logoutUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Logout Endpoint Hit.....');

    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        logger.error('Refresh Token Missing');
        res.status(400).json({
          success: false,
          message: 'Refresh Token Missing',
        });

        return;
      }

      await RefreshToken.deleteOne({ token: refreshToken });
      logger.info('Refresh Token Deleted for Logout');

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (e) {
      logger.error('Logout error occurred', e);
      next(e); // Pass the error to the next middleware for proper error handling
    }
  }


// FORGOT PASSWORD //////////////////////////////////////
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body; // Get email from request body
    try {
        const user = await User.findOne({ email }); // Find user by email
        if (!user) { // If user not found, return an error
            logger.error('User not found');
            return res.status(400).json({
                message: 'User not found',
                status: 'fail'
            });
        }

        const resetToken = crypto.randomBytes(25).toString('hex'); // Generate reset token
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

        // Send password reset email with a link containing the reset token
        await sendPasswordResetEmail(user.email, `${process.env.LOCAL_URL}/reset-password/${resetToken}`);
        await user.save(); // Save user with reset token

        return res.status(200).json({
            message: 'Password reset email sent successfully',
            status: 'success',
            User: {
                ...user.toObject(),
                password: undefined // Exclude password
            }
        });
    } catch (error) {
        logger.error('Error sending password reset:', error);
        res.status(400).json({
            message: 'Error sending password reset',
            status: 'fail'
        });
        next(error);
    }
};


// RESET PASSWORD //////////////////////////////////////
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    logger.info('Reset Password Endpoint Hit.....');
    const { token } = req.params;
    const { password, email } = req.body;

    try {
        // Find user by email and valid reset token
        const user = await User.findOne({
            email,
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() } // Ensure token is valid and not expired
        });

        // Check if user is found and token is valid
        if (!user) {
            logger.error('Invalid email or token has expired');
            return res.status(400).json({
                message: 'Invalid email or token has expired',
                status: 'fail'
            });
        }

        // Check if the new password matches the previous password
        const isSamePassword = await user.comparePassword(password);
        if (isSamePassword) {
            return res.status(400).json({
                message: 'Please use a different password',
                status: 'fail'
            });
        }

        // Invalidate the token and set the new password
        user.password = await argon2.hash(password); // Hash the new password

        // Send password reset success email
        await sendPasswordResetSuccess(user.email);

        // Invalidate other sessions if necessary
        await invalidateResetToken(user._id)
        await user.save(); // Save the updated user data

        return res.status(200).json({
            message: 'Password reset successfully',
            status: 'success'
        });

    } catch (error) {
        logger.error('Error resetting password:', error);

        res.status(500).json({
            message: 'Server error, please try again later',
            status: 'fail'
        });
        next(error);
    }
};

// GET USER PROFILE //////////////////////////////////////
export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Get User Profile Endpoint Hit.....');

    try {
        const id = req.params.id;
      const user = await User.findById(id);
        if (!user) {
            logger.error('User not found');
            res.status(400).json({
            success: false,
            message: 'User not found',
            });

            return;
        }

        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            User:{
                ...user,
                password: undefined, // Exclude password from response
                resetPasswordToken: undefined,
                resetPasswordExpiresAt: undefined,
                verificationToken: undefined,
                verificationTokenExpiresAt: undefined,
                lastLogin: undefined
            }
        });


}catch(error){
    logger.error('Error getting user profile:', error);
    res.status(500).json({
        message: 'Server error, please try again later',
        });
        next(error);
    }
}
// UPDATE USER PROFILE //////////////////////////////////////
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info('Update User Profile Endpoint Hit.....');
    try {
        const { username,address, mobile} = req.body
        const id = req.params.id;
      const user = await User.findById(id);
        if (!user) {
            logger.error('User not found');
            res.status(400).json({
            success: false,
            message: 'User not found',
            });

            return;
        }

        user.username = username || user.username;
        user.address = address || user.address;
        user.mobile = mobile || user.mobile;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User profile updated successfully',
            User:{
                ...user,
                password: undefined, // Exclude password from response
                resetPasswordToken: undefined,
                resetPasswordExpiresAt: undefined,
                verificationToken: undefined,
                verificationTokenExpiresAt: undefined,
                lastLogin: undefined
            }
        });


}catch(error){
    logger.error('Error updating user profile:', error);
    res.status(500).json({
        message: 'Server error, please try again later',
    });
        next(error);
    }
}
