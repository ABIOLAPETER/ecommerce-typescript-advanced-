// Review Controller = > Handles product review-related operations
// - Add a review for a product
// - Get all reviews for a product
// - Update a review (user only)
// - Delete a review (user only)


import { logger } from "../utils/logger";

import { Request, Response, NextFunction } from "express";

import {Product} from "../model/productModel"
import { Review } from "../model/reviewModel";
import jwt from "jsonwebtoken"


export const addReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.warn("adding Review endpoint Hit..........");

        const { productId } = req.params;
        const { comment, rating } = req.body;

        if (!req.user) {
            logger.error("User not authenticated");
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }

        const userId = (req.user as jwt.JwtPayload)?.userId;
        logger.info("User ID:", userId);

        const product = await Product.findById(productId);
        if (!product) {
            logger.error("Product not found");
            return res.status(404).json({
                status: "fail",
                message: "Product not found",
            });
        }

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            logger.error("Invalid rating value");
            return res.status(400).json({
                status: "fail",
                message: "Rating must be a number between 1 and 5",
            });
        }

        if (comment && comment.length > 500) {
            logger.error("Review is too long");
            return res.status(400).json({
                status: "fail",
                message: "Review must be less than 500 characters",
            });
        }


        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            logger.error("User has already reviewed this product");
            return res.status(400).json({
                status: "fail",
                message: "You have already reviewed this product",
            });
        }

        const newReview = await Review.create({
            userId,
            productId,
            rating,
            comment
        });

        product.ratings.push(rating);
        const totalRatings = product.ratings.length;
        product.averageRating = product.ratings.reduce((sum, r) => sum + r, 0) / totalRatings;

        await product.save();

        logger.info("Ratings and reviews added successfully");
        res.status(200).json({
            status: "success",
            data: { newReview, averageRating: product.averageRating },
        });
    } catch (error) {
        logger.error("Couldn't add review and rating:", error);
        next(error);
    }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;

        // Validate product ID
        const product = await Product.findById(productId);
        if (!product) {
            logger.error("Product not found");
            return res.status(404).json({
                status: "fail",
                message: "Product not found",
            });
        }

        // Fetch reviews for the product
        const reviews = await Review.find({ productId }).populate('userId')

        logger.info("Fetched reviews successfully");

        // Respond with reviews and product metadata
        res.status(200).json({
            status: "success",
            data: {
                reviews
            },
        });
    } catch (error) {
        logger.error("Couldn't fetch reviews:", error);
        next(error);
    }
};



export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as jwt.JwtPayload)?.userId;

        const { reviewId } = req.params;
        const {comment} = req.body

        if(!comment){
            logger.error('No comment added')
            res.status(400).json({
                status: 'fail',
                message: 'No comment added'
            })
        }
        const review = await Review.findById(reviewId);
        if (!review || !review.userId || review.userId.toString() !== userId.toString()) {
            logger.error('User not authorized to update review')
            res.status(403).json({
                status: 'fail',
                message: 'User not authorized to update review'
            })
        }
        else {
            review.comment = comment || review.comment;
            await review.save()
        }
        res.status(200).json({
            status: "success",
            data: {
                review
            },
        });
    } catch (error) {
        logger.error("Couldn't update review", error);
        next(error);
    }
};



export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.user as jwt.JwtPayload)?.userId;
        const { reviewId } = req.params;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            logger.error("Review not found");
            return res.status(404).json({
                status: "fail",
                message: "Review not found",
            });
        }

        // Check if the review belongs to the user
        if (String(review.userId) !== String(userId)) {
            logger.error("User not authorized to delete review");
            return res.status(403).json({
                status: "fail",
                message: "User not authorized to delete this review",
            });
        }

        // Delete the review
        await review.deleteOne();

        logger.info("Review deleted successfully");
        res.status(200).json({
            status: "success",
            message: "Review deleted successfully",
        });
    } catch (error) {
        logger.error("Couldn't delete review:", error);
        next(error);
    }
};
