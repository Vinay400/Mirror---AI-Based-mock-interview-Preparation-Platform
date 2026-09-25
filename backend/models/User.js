import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    // Defaults to true so accounts that predate email verification are not
    // locked out. register explicitly sets false for genuinely new accounts.
    isVerified: {
        type: Boolean,
        default: true,
    },
    // Only the SHA-256 hashes are stored, never the emailed values. Marked
    // select: false so they never ride along on ordinary lookups.
    verificationTokenHash: {
        type: String,
        select: false,
    },
    verificationTokenExpires: {
        type: Date,
        select: false,
    },
    resetTokenHash: {
        type: String,
        select: false,
    },
    resetTokenExpires: {
        type: Date,
        select: false,
    },
    // Lets authMiddleware reject session tokens issued before a password change.
    passwordChangedAt: {
        type: Date,
        select: false,
    },
},
    {
        timestamps: true,
    }
);

export default mongoose.model("User", userSchema);
