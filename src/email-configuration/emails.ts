import {
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    VERIFICATION_EMAIL_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
    ROLECHANGE_EMAIL_TEMPLATE
} from './emailTemplates'
import { apierror } from '../utils/ApiError';

import sendMail  from './nodemailerConfig';
import { logger } from '../utils/logger';


export const sendVerificationEmail = async (email: string, verificationToken: string) => {
    const recipient = email;
    if(!process.env.MAIN_MAIL) throw new apierror('Main mail is not defined', 400);
    const Admin = process.env.MAIN_MAIL;
    try {
        const response = await sendMail({
            from: Admin,
            to: recipient,
            subject: "Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category: "Email Verification",
        });

        console.log("Email sent successfully", response);
    } catch (error) {
        logger.error(`Error sending verification email:`, error);
        throw new apierror(`Error sending verification email`, 500);
    }
};

export const sendRoleChangeEmail = async (email: string, role:string) => {
    const recipient = email;
    if(!process.env.MAIN_MAIL) throw new apierror('Main mail is not defined', 400);
    const Admin = process.env.MAIN_MAIL;
    try {
        const response = await sendMail({
            from: process.env.MAIN_MAIL,
            to: recipient,
            subject: "Your Role Has Been Changed",
            html: ROLECHANGE_EMAIL_TEMPLATE.replace("{role}", role),
            category: "Email Role Change",
        });

        console.log("Role Change Email sent successfully", response);
    } catch (error) {
        logger.error(`Error sending role change email:`, error);
        throw new apierror(`Error sending role change email`, 500);
    }
};

export const sendWelcomeEmail = async (email: string, name:string) => {
    const recipient = email;
    if(!process.env.MAIN_MAIL) throw new apierror('Main mail is not defined', 400);
    if(!process.env.COMPANYNAME) throw new apierror('Main mail is not defined', 400);
    try {
        const response = await sendMail({
            from: process.env.MAIN_MAIL,
            to: recipient,
            subject: "Welcome to Auth Company",
            html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name).replace("{company}", process.env.COMPANYNAME),
            category: "Welcome Email",
        });

        console.log("Welcome Email sent successfully", response);
    } catch (error) {
       logger.error(`Error sending welcome email:`, error);
         throw new apierror(`Error sending welcome email`, 500);
    }
};

export const sendPasswordResetEmail = async (email:string, resetURL:string) => {
    const recipient = email;
    const currentDate = new Date();
    const formattedTime = currentDate.toTimeString().slice(0, 8); // HH:mm:ss
    if(!process.env.MAIN_MAIL) throw new apierror('Main mail is not defined', 400);

    try {
        const response = await sendMail({
            from: process.env.MAIN_MAIL,
            to: recipient,
            subject: "Password Reset",
            html: PASSWORD_RESET_REQUEST_TEMPLATE
                .replace("{resetURL}", resetURL)
                .replace("{date}", formattedTime),
            category: "Password Reset",
        });

        console.log("Reset Password Email sent successfully", response);
    } catch (error) {
        logger.error(`Error sending password reset email:`, error);
        throw new apierror(`Error sending password reset email`, 500);
    }
};

export const sendPasswordResetSuccess = async (email: string) => {
    const recipient = email;
    if(!process.env.MAIN_MAIL) throw new apierror('Main mail is not defined', 400);
    try {
        const response = await sendMail({
            from: process.env.MAIN_MAIL,
            to: recipient,
            subject: "Password Reset Successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset Success",
        });

        console.log("Password Reset Success Email sent successfully", response);
    } catch (error) {
        logger.error(`Error sending password reset success email:`, error);
        throw new apierror(`Error sending password reset success email`, 500);
    }
};

