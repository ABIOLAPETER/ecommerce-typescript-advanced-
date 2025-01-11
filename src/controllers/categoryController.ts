// Category Controller=> Handles category-related operations
// - Create a new category (admin only)
// - Get all categories
// - Update category details (admin only)
// - Delete a category (admin only)

import { Product } from "../model/productModel";
import {Request, Response, NextFunction} from "express"
import { logger } from "../utils/logger";
import { Category } from "../model/categoryModel";
import mongoose, { ObjectId } from "mongoose"

export const createCategory = async (req: Request, res: Response, next:NextFunction) => {
    try {
        logger.warn(`createCategory Endpoint hit`);
        const {name, description} = req.body

        const category = new Category({
            name: name,
            description: description
        })

        const newCategory = await category.save();
        logger.info(`Category created successfully`);
        res.status(201).json(newCategory);

    } catch (error) {
        logger.error(`Error creating category: ${error}`);
        res.status(500).json({ message: "Internal server error" });
        next(error);
    }
}

export const getAllCategories = async (req: Request, res: Response, next:NextFunction) => {
    try {
        logger.warn(`getAllCategories Endpoint hit`);
        const categories = await Category.find();
        logger.info(`Categories fetched successfully`);
        res.status(200).json(categories);
    } catch (error) {
        logger.error(`Error fetching categories: ${error}`);
        res.status(500).json({ message: "Internal server error" });
        next(error);
    }
}

export const updateCategory = async (req: Request, res: Response, next:NextFunction) => {
    try {
        logger.warn(`updateCategory Endpoint hit`);
        const {name, description} = req.body
        const categoryId = req.params.id

        const category = await Category.findById(categoryId);

        if (!category) {
            logger.error(`Category not found`);
            return res.status(404).json({ message: "Category not found" });
        }
        category.name = name || category.name;
        category.description = description || category.description;
        await category.save();
        logger.info(`Category updated successfully`);
        res.status(200).json(category);
    } catch (error) {
        logger.error(`Error updating category: ${error}`);
        res.status(500).json({ message: "Internal server error" });
        next(error);
    }
}

export const deleteCategory = async (req: Request, res: Response, next:NextFunction) => {
    try {
        logger.warn(`deleteCategory Endpoint hit`);
        const categoryId = req.params.id
        const category = await Category.findByIdAndDelete(categoryId);

        logger.info(`Category deleted successfully`);
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        logger.error(`Error deleting category: ${error}`);
        res.status(500).json({ message: "Internal server error" });
        next(error);
    }
}

export const addProductToCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.body;
        const categoryId = req.params.id;

        // Validate product existence
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Validate category existence
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Add product to category
        if (!category.products.includes(productId as mongoose.Types.ObjectId)) {
            category.products.push(productId as mongoose.Types.ObjectId);
            await category.save();
        }

        // Update product's category field
        product.category = categoryId as unknown as mongoose.Types.ObjectId;
        await product.save();

        res.status(200).json({
            status: "success",
            message: "Product added to category successfully",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};
