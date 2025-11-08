import mongoose from "mongoose";
import { Todo } from "../models/todo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// ----------------------------------------------------------------------
// 1. ADD TODO (Create)
// ----------------------------------------------------------------------
const addTodo = asyncHandler(async (req, res) => {
    const { title, description, dueDate } = req.body;
   console.log("Add Todo Request Body:", req.body);
   
    if (!title) {
        throw new ApiError(400, "Title is required for the todo");
    }

    const todo = await Todo.create({
        title,
        description,
        dueDate: dueDate || null,
        owner: req.user._id, 
        status:"pending",
    });

    if (!todo) {
        throw new ApiError(500, "Failed to create todo item");
    }

    return res.status(201).json(
        new ApiResponse(201, todo, "Todo added successfully")
    );
});


// ----------------------------------------------------------------------
// 2. UPDATE TODO (Update)
// ----------------------------------------------------------------------
const updateTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;
  const { title, description, status, dueDate } = req.body;

  console.log("TodoID:", todoId);

  if (!mongoose.Types.ObjectId.isValid(todoId)) {
    throw new ApiError(400, "Invalid Todo ID");
  }

  const updateFields = {};
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;

  if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
    updateFields.status = status;
  }

  if (dueDate !== undefined) updateFields.dueDate = dueDate;

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  // ✅ Admin can update any todo, others can only update their own
  const isAdmin = req.user.role === "admin";

  const query = isAdmin
    ? { _id: todoId } // Admin can update any todo
    : { _id: todoId, owner: req.user._id }; // Normal user can only update their own todos

  const updatedTodo = await Todo.findOneAndUpdate(
    query,
    { $set: updateFields },
    { new: true }
  ).populate("owner", "username email");

  if (!updatedTodo) {
    throw new ApiError(
      404,
      isAdmin
        ? "Todo not found"
        : "Todo not found or you are not authorized to update it"
    );
  }

  return res.status(200).json(
    new ApiResponse(200, updatedTodo, "Todo updated successfully")
  );
});


// ----------------------------------------------------------------------
// 3. DELETE TODO (Delete)
// ----------------------------------------------------------------------
const deleteTodo = asyncHandler(async (req, res) => {
  const { todoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(todoId)) {
    throw new ApiError(400, "Invalid Todo ID");
  }

  const isAdmin = req.user.role === "admin";

  const query = isAdmin
    ? { _id: todoId } // Admin can delete any todo
    : { _id: todoId, owner: req.user._id }; // Normal user can delete only own todos

  const deletedTodo = await Todo.findOneAndDelete(query);

  if (!deletedTodo) {
    throw new ApiError(
      404,
      isAdmin
        ? "Todo not found"
        : "Todo not found or you are not authorized to delete it"
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { deletedId: todoId }, "Todo deleted successfully")
  );
});



// ----------------------------------------------------------------------
// 4. GET ALL TODOS (For Admin)
// ----------------------------------------------------------------------
const getTodos = asyncHandler(async (req, res) => {
    let query = {};
    
    // If the user is a standard 'user', filter by their ID (Ownership)
    console.log("User Role:", req.user.role);
    
    if (req.user.role === 'user') {
        query = { owner: req.user._id };
    }


    const todos = await Todo.find(query)
        .populate("owner", "username email role") 
        .sort({ createdAt: -1 }); 

    return res.status(200).json(
        new ApiResponse(200, todos, `Todos retrieved successfully. Role: ${req.user.role}`)
    );
});



const getTodoById = asyncHandler(async (req, res) => {
    const { todoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(todoId)) {
        throw new ApiError(400, "Invalid Todo ID");
    }

    const todo = await Todo.findById(todoId).populate("owner", "username email role");

    if (!todo) {
        throw new ApiError(404, "Todo not found");
    }
    
    const isOwner = todo.owner._id.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Forbidden: You are not authorized to view this todo");
    }

    return res.status(200).json(
        new ApiResponse(200, todo, "Todo retrieved successfully")
    );
});


export { 
    addTodo,
    updateTodo,
    deleteTodo,
    getTodos,
    getTodoById
};