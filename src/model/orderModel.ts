import mongoose from 'mongoose';
import { itemSchema } from './itemSchema';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        unique: true
    },
    items: [itemSchema],
    shippingInfo:{
        type: Object,
    },
    status: {
        type: String,
        default: "pending",
        enum: ['shipped', 'pending', 'delivered']
    },
    paymentInfo: {
        type: Object
    },
    totalPrice: {
        type: Number
    }
}, {timestamps: true});


export const Order = mongoose.model('Order', orderSchema)
