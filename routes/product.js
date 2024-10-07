import express from "express";
import axios from "axios";
import Product from "../models/Product.js";

const routes = express.Router();

// Initialize the database with seed data from a third-party API
routes.get("/initialize", async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const products = response.data;
        await Product.insertMany(products);
        res.status(200).send({ products });
    } catch (error) {
        res.status(500).send("An error occurred while saving data");
    }
});

// Get transactions with search and pagination
routes.get('/transactions', async (req, res) => {
    const { search, page = 1, perPage = 10 } = req.query;

    let query = {};

    if (search) {
        if (!isNaN(search)) {
            // If the search query is a number, apply it to the price field
            query.price = Number(search);
        } else {
            // Otherwise, search in title or description
            query = {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }
    }

    try {
        const products = await Product.find(query)
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        res.status(200).json(products);
    } catch (error) {
        res.status(500).send("An error occurred while fetching transactions");
    }
});

// Get sales statistics for a specific month
routes.get('/statistics', async (req, res) => {
    const { month } = req.query;

    const start = new Date(`2021-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    try {
        const totalSales = await Product.aggregate([
            { $match: { dateOfSale: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: null,
                    totalSaleAmount: { $sum: '$price' },
                    totalSoldItems: { $sum: { $cond: ['$sold', 1, 0] } },
                    totalNotSoldItems: { $sum: { $cond: ['$sold', 0, 1] } }
                }
            }
        ]);

        res.status(200).json(totalSales[0]);
    } catch (error) {
        res.status(500).send("An error occurred while fetching statistics");
    }
});

// Get price range data for bar chart
routes.get('/price-range', async (req, res) => {
    const { month } = req.query;

    const start = new Date(`2021-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    try {
        const priceRanges = await Product.aggregate([
            { $match: { dateOfSale: { $gte: start, $lt: end } } },
            {
                $bucket: {
                    groupBy: '$price',
                    boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
                    default: 'Others',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        res.status(200).json(priceRanges);
    } catch (error) {
        res.status(500).send("An error occurred while fetching price ranges");
    }
});

// Get category data for pie chart
routes.get('/categories', async (req, res) => {
    const { month } = req.query;

    const start = new Date(`2021-${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    try {
        const categoryData = await Product.aggregate([
            { $match: { dateOfSale: { $gte: start, $lt: end } } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json(categoryData);
    } catch (error) {
        res.status(500).send("An error occurred while fetching categories");
    }
});

// Get combined data for statistics, price range, and categories
routes.get('/combined-data', async (req, res) => {
    const { month } = req.query;
    const baseURL = `http://localhost:${process.env.PORT || 5000}/api/product`;

    try {
        // Fetching from internal APIs with the full URL
        const statistics = await axios.get(`${baseURL}/statistics?month=${month}`);
        const priceRange = await axios.get(`${baseURL}/price-range?month=${month}`);
        const categories = await axios.get(`${baseURL}/categories?month=${month}`);

        // Combine all the data into one response
        res.status(200).json({
            statistics: statistics.data,
            priceRange: priceRange.data,
            categories: categories.data
        });
    } catch (error) {
        console.error("Error fetching combined data", error);
        res.status(500).send("An error occurred while fetching combined data");
    }
});


export default routes;
