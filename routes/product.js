import express from "express";
import axios from "axios";
import Product from "../models/Product.js";
const routes = express.Router();

routes.get("/getdata", async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const products = response.data;
        await Product.insertMany(products);
        res.status(200).send({products});
    } catch (error) {
        res.status(500).send("An error occurred while saving data");
    }
});

export default routes;