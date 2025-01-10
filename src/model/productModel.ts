import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type : Number,
        required: true
    },
    stock:{
        type: Number,
        required: true
    },
    category:{
        type: mongoose.Types.ObjectId,
        ref: 'Category',
    },
    images: {
        type: Array,
        required: true
    },
    ratings: {
        type: Array
    }
}, {timestamps: true});


export const Product = mongoose.model('Product', productSchema)
