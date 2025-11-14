const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const dotEnv = require('dotenv');
const userRoute = require('./route/userRouters'); // Correctly import the router

const app = express();

dotEnv.config();
connectDB();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  // origin: 'https://cableoperator.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json()); // ✅ This must be BEFORE routes

// Routes
app.use('/api/users', userRoute); // ✅ Connect router

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
