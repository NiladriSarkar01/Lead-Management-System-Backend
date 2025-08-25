import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRoutes from './routes/auth.route.js';
import connectDB from './lib/db.js';
import { clients } from './constants/environment.constants.js';
import leadRoutes from './routes/lead.route.js';

dotenv.config();

const app = express();

const PORT =process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:clients,
    credentials:true,
}))

app.use('/api/auth', authRoutes);
app.use('/api/lead', leadRoutes);

app.listen(PORT, ()=>{
    console.log(`Application started at http://localhost:${PORT}`);
    connectDB();
    
})
