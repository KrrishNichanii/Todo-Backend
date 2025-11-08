import dotenv from 'dotenv';
dotenv.config();

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import connectDB from "./db/db.js";
import v1Router from './routes/apiRoutes.js' ;
import errorMiddleware from './middlewares/error.middleware.js';

const app = express() ; 


const PORT = process.env.PORT || 8000

connectDB()
.then(() => {
    app.listen(PORT ,() => {
        console.log(`Server running at port : ${PORT}`);
    })
})
.catch((e) => {
    console.log('MongoDB connection failed !!!',e);
})


app.use(express.json({limit:"32kb"})) ; 
app.use(express.urlencoded({extended:true ,limit: "32kb"})) ; 
app.use(cookieParser()) ;



const corsOptions = {
  origin: process.env.FRONTEND_URL ||  'http://localhost:3000' ,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, 
};

app.use(cors(corsOptions));
app.use('/api',v1Router) ;
app.use(errorMiddleware) ; 
app.use('/', (req,res) => {
    res.send('Backend is running....')
}) ;
