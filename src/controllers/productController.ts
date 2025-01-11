// Product Controller=> Handles product-related operations
// - Create a new product (admin only)
// - Get all products with pagination and filtering
// - Get a single product by ID
// - Update product details (admin only)
// - Delete a product (admin only)
// - Get products by category
// - Add product ratings and reviews
// - Get average rating and reviews for a product
import mongoose, { ObjectId } from "mongoose"
import { ApiFeatures } from "../utils/ApiFeatures";
import { logger } from "../utils/logger";
import { User,invalidateResetToken} from "../model/userModel";
import { generateWebToken } from "../utils/generateWebToken";
import { validateReg } from "../utils/validate";
import { validateLogin } from "../utils/validate";
import { Request, Response, NextFunction } from "express";
import { RefreshToken } from "../model/refrehToken";
import { Category } from "../model/categoryModel";

import {Product} from "../model/productModel"
import { Review } from "../model/reviewModel";
import jwt from "jsonwebtoken"

//CREATE PRODUCT

import multer from 'multer';
import path from 'path';

// Configure Multer storage and file handling directly in the controller
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/product-images/'); // Directory for uploaded images
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// Configure file filtering
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Multer upload instance
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter,
}).array('images', 5); // Allow up to 5 images

// Controller function
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.warn('Creating product');

        // Handle file uploads using Multer directly
        upload(req, res, async (err: any) => {
            if (err) {
                logger.error('File upload error', err);
                return res.status(400).json({
                    status: 'fail',
                    message: err.message || 'Error uploading files',
                });
            }

            const { name, description, price, stock } = req.body;

            // Validate required fields
            if (!name || !description || !price || !stock) {
                logger.error('All fields are required');
                return res.status(400).json({
                    status: 'fail',
                    message: 'All fields are required',
                });
            }

            // Check uploaded files
            const files = req.files as Express.Multer.File[];
            if (!files || files.length === 0) {
                logger.error('Product image is required');
                return res.status(400).json({
                    status: 'fail',
                    message: 'Product image is required',
                });
            }

            // Extract image paths
            const imagePaths = files.map((file) => file.path);

            // Save product to the database
            const product = await Product.create({
                name,
                description,
                price,
                stock,
                images: imagePaths,
            });

            logger.info('Product created successfully');
            res.status(201).json({
                status: 'success',
                data: product,
            });
        });
    } catch (error) {
        logger.error('Could not create product', error);
        res.status(500).json({
            status: 'fail',
            message: 'Could not create product',
        });
        next(error);
    }
};

export const getAllProducts = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        // Create an instance of ApiFeatures to handle query features
            const features = new ApiFeatures(Product.find(), req.query)
            .filter() // Filter based on query parameters
            .sort()   // Sort based on query parameters
            .limitFields() // Limit fields to return in the response
            .paginate(); // Paginate the results

        let products = await features.query; // Execute the query

        // Send response with status and movies data
        logger.info('Got All Products')
        res.status(200).json({
            status: 'success',
            length: products.length,
            data: {
            products
            }
        });
    } catch (error) {
        logger.error('Could not get all products', error);
        res.status(500).json({
            status: 'fail',
            message: 'Could not get all products',
        });
        next(error);
    }
}

export const getProduct = async(req:Request, res:Response, next:NextFunction)=>{
    try {
        logger.warn('Getting product');
        const {id} = req.params
        const product = await Product.findById(id)
        if(!product){
            logger.error('Product not found');
            res.status(400).json({
                status: 'fail',
                message: 'Product not found',
            })
            return;
        }

        res.status(200).json({
            status: 'success',
            data: product
        })
    } catch (error) {
        logger.error('Could not get product', error);
        res.status(500).json({
            status: 'fail',
            message: 'Could not get product',
        });
        next(error);
    }
}

export const updateProduct = async(req:Request, res:Response, next:NextFunction)=>{
    try {
        logger.warn('Updating product..........');
        const {id} = req.params
        const {name, description, stock, price} = req.body
        const product = await Product.findById(id)
        if(!product){
            logger.error('Product not found');
            res.status(400).json({
                status: 'fail',
                message: 'Product not found',
            })
            return;
        }
        product.name = name
        product.description = description
        product.stock = stock
        product.price = price

        await product.save()
        logger.info('Product updated successfully');


        res.status(200).json({
            status: 'success',
            data: product
        })
    } catch (error) {
        logger.error('Could not update product', error);
        res.status(500).json({
            status: 'fail',
            message: 'Could not update product',
        });
        next(error);
    }
}


export const deleteProduct = async(req:Request, res:Response, next:NextFunction)=>{
    try {
        logger.warn('Deleting product..............');
        const {id} = req.params
        const product = await Product.findByIdAndDelete(id)
        if(!product){
            logger.error('Product not found');
            res.status(400).json({
                status: 'fail',
                message: 'Product not found',
            })
            return;
        }

        const checkIfProductStillExists = await Product.findById(id)
        if(checkIfProductStillExists){
            logger.error('product wasnt deleted')
            res.status(400).json({
                status: 'fail',
                message: 'Product wasnt deleted',
            })
            return
        }else{
            logger.info('Product deleted successfully');
            res.status(200).json({
                status: 'success',
                message: 'Product deleted successfully',
            })
            return
        }
    } catch (error) {
        logger.error('Could not delete product', error);
        res.status(500).json({
            status: 'fail',
            message: 'Could not delete product',
        });
        next(error);
    }
}

export const getProductByCategory = async(req: Request, res: Response, next: NextFunction)=>{
    try {
        logger.warn('Get Products by Category EndPoint Hit.........')
        const {categoryId} = req.params
        const products = await Product.find().populate('category').where('category').equals(categoryId)

        if (!products){
            logger.error('No products available')
            res.status(400).json({
                status: 'fail',
                message: 'No products available'
            })
        }else{
            logger.info('gotten all product by the given category')
            res.status(200).json({
                status: 'success',
                data: products
            })
        }
    } catch (error) {
        logger.error('Couldnt get products by category')
        res.status(400).json({
            status: 'fail',
            message: 'Couldnt get products by category'
        })
    }
}


export const addProductRatingandReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.warn("Rating and Reviewing endpoint Hit..........");

        const { productId } = req.params;
        const { rating, review } = req.body;

        if (!req.user) {
            logger.error("User not authenticated");
            return res.status(401).json({
                status: "fail",
                message: "User not authenticated",
            });
        }

        const userId = (req.user as jwt.JwtPayload)?.userId;
        logger.info("User ID:", userId);

        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            logger.error("Invalid rating value");
            return res.status(400).json({
                status: "fail",
                message: "Rating must be a number between 1 and 5",
            });
        }

        if (review && review.length > 500) {
            logger.error("Review is too long");
            return res.status(400).json({
                status: "fail",
                message: "Review must be less than 500 characters",
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            logger.error("Product not found");
            return res.status(404).json({
                status: "fail",
                message: "Product not found",
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
            comment: review,
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

export const addCategoryToProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.warn("Add Category to Product endpoint hit");

        const { categoryId } = req.body;
        const productId = req.params.id;

        // Validate product existence
        const product = await Product.findById(productId);
        if (!product) {
            logger.error(`Product not found: ${productId}`);
            return res.status(404).json({
                status: "fail",
                message: `Product with ID ${productId} not found`,
            });
        }

        // Validate category existence
        const category = await Category.findById(categoryId);
        if (!category) {
            logger.error(`Category not found: ${categoryId}`);
            return res.status(404).json({
                status: "fail",
                message: `Category with ID ${categoryId} not found`,
            });
        }

        let productUpdated = false;
        let categoryUpdated = false;

        // Add category to product
        if (String(product.category) !== String(categoryId)) {
            product.category = categoryId;
            await product.save();
            productUpdated = true;
        }

        // Add product to category
        if (!category.products.includes(productId as unknown as mongoose.Types.ObjectId)) {
            category.products.push(productId as unknown as mongoose.Types.ObjectId);
            await category.save();
            categoryUpdated = true;
        }

        const message = `${productUpdated ? "Product updated" : ""}${
            productUpdated && categoryUpdated ? " and " : ""
        }${categoryUpdated ? "Category updated" : ""}`;

        res.status(200).json({
            status: "success",
            message: message || "No changes made",
            data: {
                product,
                category,
            },
        });
    } catch (error) {
        logger.error("Couldn't add category to product:", error);
        next(error);
    }
};
