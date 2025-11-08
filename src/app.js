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




const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'https://todo-frontend-fx2aoijs8-krrish-nichaniis-projects.vercel.app', // production frontend
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // if you use cookies
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

app.use(cors(corsOptions));
app.use('/api',v1Router) ;
app.use(errorMiddleware) ; 
app.use('/', (req,res) => {
    res.send('Backend is running....')
}) ;
