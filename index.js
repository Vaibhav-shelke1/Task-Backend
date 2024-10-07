import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectToMongo from "./db.js"; // MongoDB connection
import productRoute from "./routes/product.js"; // Product routes

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectToMongo();

// Middleware
app.use(cors()); // Enable CORS for all origins (can restrict later if needed)
app.use(express.json()); // Parse incoming JSON requests

// Route Middleware
app.use("/api/product", productRoute);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
