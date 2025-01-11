import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
    {
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
        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Refers to the Product model
            },
        ],
    },
    { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
