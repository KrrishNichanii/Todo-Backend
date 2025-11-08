import { Router } from 'express';
import { 
    registerUser, 
    loginUser,
    logoutUser,
    changeUserRole,
    toggleUserActiveStatus,
    getAllUsers
} from '../../controllers/user.controller.js';

import { verifyJWT } from '../../middlewares/auth.middleware.js'; 
import { isAdmin } from '../../middlewares/admin.middleware.js'; 

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// Routes that require a user to be logged in
router.route("/logout").post(verifyJWT, logoutUser); 

// Admin Routes (Require both authentication AND admin role)

router.route("/promote/:userId").patch(verifyJWT, isAdmin, changeUserRole);
router.route("/toggle-active/:userId").patch(verifyJWT, isAdmin, toggleUserActiveStatus);
router.route("/users").get(verifyJWT, isAdmin, getAllUsers);
export default router;