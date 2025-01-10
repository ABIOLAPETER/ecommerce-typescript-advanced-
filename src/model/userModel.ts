import mongoose, { Document } from 'mongoose';
import argon2 from 'argon2';
import { apierror } from '../utils/ApiError';

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
}

const userSchema = new mongoose.Schema<IUser>({
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
    default: ' ',
  },
  mobile: {
    type: Number,
  },
  resetPasswordToken: {
    type: String
  },
  isverified: {
    type: Boolean,
    default: false
  },
    resetPasswordExpiresAt: {
        type:Date
    },
    verificationToken: {
        type:String
    }, // Store only the token as a string
    verificationTokenExpiresAt: {
        type: Date
    },
    lastLogin: {
      type: Date
    }
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
  if (this.isModified('password')) {
    try {
      this.password = await argon2.hash(this.password);
    } catch (e) {
      console.log(e);
      return next(new apierror('Error in hash password', 400));
    }
  }
  next();
});

// userSchema.pre('save', function (next) {
//   this.confirmPassword = undefined;
//   next();
// });

export const invalidateResetToken = async (userId: string) => {
  await User.findByIdAndUpdate(userId, {
      resetPasswordToken: undefined,
      resetPasswordExpiresAt: undefined
  });
};

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (e) {
    console.log(e);
    throw new apierror('Error in verifying password', 400);
  }
};


userSchema.index({ username: 'text' });

export const User = mongoose.model<IUser>('User', userSchema);
