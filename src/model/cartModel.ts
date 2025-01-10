import mongoose from 'mongoose';
import { itemSchema } from './itemSchema';


const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    unique: true
  },
  items: [itemSchema],
  totalPrice: {
    type: Number
  }
}, { timestamps: true });

export const Cart = mongoose.model('Cart', cartSchema);
