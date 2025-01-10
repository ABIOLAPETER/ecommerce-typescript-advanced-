import mongoose from 'mongoose';


const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        unique: true
    },
    orderId: {
        type: mongoose.Types.ObjectId,
        ref: 'Order',
        unique: true
    },
    method:{
        type: String,
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Success', 'Failed']
    },
    transactionId:{
        type: String
    },
    amount: {
        type: Number,
        required: true
    }
}, {timestamps: true});


export const Payment = mongoose.model('Payment', paymentSchema)
