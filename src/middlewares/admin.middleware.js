import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to check if the authenticated user has the 'admin' role.
 * Requires verifyJWT middleware to run before it to populate req.user.
 */
const isAdmin = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(401, "Authentication failed: User data not found.");
    }

    if (req.user.role !== 'admin') {
        throw new ApiError(403, "Forbidden: Only administrators can perform this action.");
    }

    next();
});

export { isAdmin };