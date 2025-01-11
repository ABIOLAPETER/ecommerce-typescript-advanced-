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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    images: {
        type: Array,
        required: true
    },
    ratings: {
        type: Array
    },
    averageRating: {
        type: Number,
    }
}, {timestamps: true});


export const Product = mongoose.model('Product', productSchema)
