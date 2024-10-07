import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectToMongo from "./db.js"; 
import productRoute from "./routes/product.js";
dotenv.config();
const app=express();
const port=process.env.PORT||5000;
connectToMongo();
app.use(express.json());
app.use("/api/product",productRoute);

app.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})