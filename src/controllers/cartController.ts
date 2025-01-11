// Cart Controller=> Handles cart-related operations
// - Add an item to the cart
// - Remove an item from the cart
// - Update item quantity in the cart
// - Get the current user's cart
// - Clear the cart

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
// import { Request, Response, NextFunction } from "express";
// import mongoose from "mongoose";
import { Cart } from "../model/cartModel";
// import { Product } from "../model/productModel";
// import { logger } from "../utils/logger";

export const addItemToCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { productId, quantity } = req.body;
        const userId = (req.user as jwt.JwtPayload)?.userId;

        // Validate product existence
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Validate stock availability
        if (quantity > product.stock) {
            return res.status(400).json({ message: "Quantity exceeds available stock" });
        }

        // Find or create a cart for the user
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }

        // Check if the product is already in the cart
        const existingItem = cart.items.find((item: any) => item.productId.toString() === productId);
        if (existingItem) {
            // Update quantity and price for existing item
            existingItem.quantity += quantity;
            existingItem.price = product.price * existingItem.quantity;
        } else {
            // Add new item to the cart
            cart.items.push({
                productId: new mongoose.Types.ObjectId(productId),
                quantity,
                price: product.price * quantity,
            });
        }

        // Save the cart
        await cart.save();

        // Reduce product stock
        product.stock -= quantity;
        await product.save();

        logger.info("Item added to cart successfully");
        return res.status(200).json({
            status: "success",
            message: "Item added to cart successfully",
            data: cart,
        });
    } catch (error) {
        logger.error(`Error in addItemToCart: ${error}`);
        next(error);
    }
};



export const removeItemFromCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        logger.warn("Removing Item from Cart Endpoint Hit");

        const { productId } = req.body;
        const userId = (req.user as jwt.JwtPayload)?.userId;

        // Find the cart for the user
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            logger.error("Cart does not exist");
            return res.status(404).json({
                status: "fail",
                message: "Cart does not exist",
            });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex((item: any) => item.productId.toString() === productId);
        if (itemIndex === -1) {
            logger.error("Item does not exist in the cart");
            return res.status(404).json({
                status: "fail",
                message: "Item does not exist in the cart",
            });
        }

        // Get the item details and remove it
        const removedItem = cart.items[itemIndex];
        cart.items.splice(itemIndex, 1);

        // Update the total price
        cart.totalPrice -= removedItem.price;

        // Save the updated cart
        await cart.save();

        logger.info("Item removed from cart successfully");
        return res.status(200).json({
            status: "success",
            message: "Item removed from cart successfully",
            data: cart,
        });
    } catch (error) {
        logger.error(`Error removing item from cart: ${error}`);
        next(error);
    }
};
