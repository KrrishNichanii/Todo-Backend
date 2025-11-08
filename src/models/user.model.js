import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define the schema for the User
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true 
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        // Role for Role-Based Access Control (RBAC)
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        // Status for account deactivation
        isActive: {
            type: Boolean,
            default: true // Account is active by default
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true // Adds createdAt and updatedAt fields
    }
);

// Pre-save hook to hash the password before saving (only if modified)
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    
    // Hash the password with a salt of 10 rounds
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Custom method to compare submitted password with the hashed password
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Custom method to generate an Access Token (JWT)
userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role // Include role in token for auth checks
        },
        process.env.TOKEN_SECRET,
        {
            expiresIn: process.env.TOKEN_EXPIRY || "1d"
        }
    );
};

// Method to generate a Refresh Token (long-lived)
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.TOKEN_SECRET, 
        {
            expiresIn: '10d' // Typically much longer than access token
        }
    )
}


export const User = mongoose.model("User", userSchema);