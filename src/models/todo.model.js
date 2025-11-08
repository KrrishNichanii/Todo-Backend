import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed'],
            default: 'pending'
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference the User model
            required: true
        },
        dueDate: {
            type: Date,
            default: null // Optional due date
        }
    },
    {
        timestamps: true 
    }
);

export const Todo = mongoose.model("Todo", todoSchema);