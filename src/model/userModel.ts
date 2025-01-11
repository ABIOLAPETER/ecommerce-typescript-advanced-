import mongoose, { Document } from 'mongoose';
import argon2 from 'argon2';
import { apierror } from '../utils/ApiError';
import { cartSchema } from './cartModel';

interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'User' | 'Admin';
  address: string;
  mobile?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  isverified: boolean;
  lastLogin?: Date;
  cart: Array<mongoose.Types.ObjectId>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      // match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'], // Regex for email validation
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'User',
      enum: ['User', 'Admin'],
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    mobile: {
      type: Number,
      validate: {
        validator: (value: number) => value.toString().length === 10,
        message: 'Mobile number must be 10 digits long',
      },
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    isverified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
    cart: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Cart',
      default: [],
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (e) {
      console.error(e);
      return next(new apierror('Error in hashing password', 400));
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (e) {
    console.error(e);
    throw new apierror('Error in verifying password', 400);
  }
};

// Invalidate reset token
export const invalidateResetToken = async (userId: string) => {
  await User.findByIdAndUpdate(userId, {
    resetPasswordToken: undefined,
    resetPasswordExpiresAt: undefined,
  });
};

// Text index on username
userSchema.index({ username: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);
