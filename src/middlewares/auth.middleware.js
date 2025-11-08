import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // 1. Extract Token: Check in cookies first, then in the Authorization header (Bearer token)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: Access token missing");
        }

        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token or User not found");
        }

        req.user = user;
        
        next();

    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid Access Token");
        }
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Access Token Expired");
        }

        if (error instanceof ApiError) {
             throw error;
        } else {
             throw new ApiError(500, "Authentication error", [error.message]);
        }
    }
});

export { verifyJWT };