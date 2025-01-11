import mongoose from 'mongoose';
import { itemSchema } from './itemSchema';

export const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
    items: {
      type: [itemSchema],
      default: [],
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0, // Ensure total price is never negative
    },
  },
  { timestamps: true }
);

// Middleware to automatically calculate totalPrice
cartSchema.pre('save', function (next) {
  this.totalPrice = this.items.reduce((total: number, item: any) => {
    return total + item.price * item.quantity;
  }, 0);
  next();
});

export const Cart = mongoose.model('Cart', cartSchema);
