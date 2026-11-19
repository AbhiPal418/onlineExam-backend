// // import express from "express";
// import connectDB from "./config/db.js";
// // const app = express();
// import { app } from "./app.js";
// import dotenv from "dotenv";

// dotenv.config();
// connectDB();

// const PORT = process.env.PORT || 3000;

// app.get("/", (req, res) => {
// 	res.send("Hello, World!");
// });

// app.listen(PORT, () => {
// 	console.log(`Server is running on port ${PORT}`);
// });



// import "dotenv/config";
// import { app } from "./app.js";
// import connectDB from "./config/db.js";
// const PORT = process.env.PORT || 3000;

// connectDB();



// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });


import "dotenv/config";

import { app } from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // First connect to MongoDB
        await connectDB();

        // Then start Express
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
