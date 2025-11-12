import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js"; 



const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax" 
};

// Helper function to generate and set both access and refresh tokens
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save the new refresh token to the database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); 

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens" , error.message);
    }
}


// ----------------------------------------------------------------------
// 1. REGISTER USER
// ----------------------------------------------------------------------
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body;

    // 1. Basic Validation
    if ([username, email, password].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // 2. Checking if user or email already exists
    const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
    });

    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // 3. Create User
    const user = await User.create({
        username,
        email,
        password, 
        role: role || 'user'
    });

    // 4. Verify user was created successfully
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});


// ----------------------------------------------------------------------
// 2. LOGIN USER
// ----------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // 2. Find User by email
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 3. Check Password
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // 4. Generate Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // 5. Clean up user object for response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // 6. Set tokens in cookies and send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken, 
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});


// ----------------------------------------------------------------------
// 3. LOGOUT USER
// ----------------------------------------------------------------------
const logoutUser = asyncHandler(async (req, res) => {
    // Clear the refresh token from the database
    if (!req.user?._id) {
        throw new ApiError(401, "User not authenticated for logout");
    }

    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                refreshToken: undefined 
            }
        },
        { new: true }
    );

    // Clear cookies from the client
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// ----------------------------------------------------------------------
// 4. ADMIN PRIVILEGE: Change User Role
// ----------------------------------------------------------------------
const changeUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
        throw new ApiError(400, "Valid role ('user' or 'admin') is required");
    }

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
        throw new ApiError(404, "Target user not found");
    }

    // Prevent admin from changing their own role via this API
    if (userToUpdate._id.equals(req.user._id)) {
        throw new ApiError(403, "You cannot change your own role via this endpoint");
    }

    userToUpdate.role = role;
    await userToUpdate.save({ validateModifiedOnly: true });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { 
                _id: userToUpdate._id, 
                role: userToUpdate.role 
            }, `User role successfully changed to ${role}`)
        );
});


// ----------------------------------------------------------------------
// 5. ADMIN PRIVILEGE: Toggle User Active Status
// ----------------------------------------------------------------------
const toggleUserActiveStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
        throw new ApiError(404, "Target user not found");
    }

    // Prevent admin from deactivating their own account
    if (userToUpdate._id.equals(req.user._id)) {
        throw new ApiError(403, "You cannot deactivate your own account");
    }

    // Toggle the status
    userToUpdate.isActive = !userToUpdate.isActive;
    await userToUpdate.save({ validateModifiedOnly: true });
    
    const newStatus = userToUpdate.isActive ? "activated" : "deactivated";

    return res
        .status(200)
        .json(
            new ApiResponse(200, { 
                _id: userToUpdate._id, 
                isActive: userToUpdate.isActive 
            }, `User account successfully ${newStatus}`)
        );
});

// ----------------------------------------------------------------------
// 6. ADMIN PRIVILEGE: Get All Users
// ----------------------------------------------------------------------
const getAllUsers = asyncHandler(async (req, res) => {
    // ✅ Only admins can fetch all users
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can view all users");
    }

    // Optional: add pagination for large datasets
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch all users except passwords and refresh tokens
    const users = await User.find({})
        .select("-password -refreshToken")
        .skip(skip)
        .limit(limit);

    // Count total users for pagination
    const totalUsers = await User.countDocuments();

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers,
        }, "Users fetched successfully")
    );
});

export { 
    registerUser, 
    loginUser,
    logoutUser ,
    changeUserRole,
    toggleUserActiveStatus ,
    getAllUsers
};