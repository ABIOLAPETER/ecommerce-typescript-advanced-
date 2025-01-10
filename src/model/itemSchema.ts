import mongoose from "mongoose"

export const itemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
});
