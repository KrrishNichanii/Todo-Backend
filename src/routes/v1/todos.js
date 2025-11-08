import { Router } from 'express';
import { 
    addTodo,
    getTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
} from '../../controllers/todo.controller.js';
import { verifyJWT } from '../../middlewares/auth.middleware.js'; 

const router = Router();

// All routes here are protected by the verifyJWT middleware
router.use(verifyJWT); 

// Route: /api/v1/todos
router.route("/")
    .post(addTodo) 
    .get(getTodos); // Get all todos (Admins see all, Users see their own)

// Route: /api/v1/todos/:todoId
router.route("/:todoId")
    .get(getTodoById) // Get a specific todo
    .patch(updateTodo) // Update a specific todo
    .delete(deleteTodo); // Delete a specific todo

export default router;