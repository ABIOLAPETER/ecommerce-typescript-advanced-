import mongoose from 'mongoose';


const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        unique: true
    },
    productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product'
    },
    comment:{
        type: String,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
}, {timestamps: true});


export const Review = mongoose.model('Review', reviewSchema)
