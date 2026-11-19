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



import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./config/db.js";
const PORT = process.env.PORT || 3000;

// app.use(async (req, res, next) => {
try {
    await connectDB();
    next();
} catch (error) {
    next(error);
}
// });


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import app from "./app.js";

// dotenv.config();

// const PORT = process.env.PORT || 8000;

// connectDB()
//     .then(() => {
//         app.listen(PORT, () => {
//             console.log(`Server running on port ${PORT}`);
//         });
//     })
//     .catch((error) => {
//         console.error("Server startup failed:", error);
//         process.exit(1);
//     });
