import express from 'express' ;
import userRouter from './users.js' ;
import todoRouter from './todos.js' ;


const router = express.Router() ;


router.use('/users' , userRouter) ; 
router.use('/todos' , todoRouter) ; 

export default  router ;