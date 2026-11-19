// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';

// const app = express();
// app.use(cors(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// })));

// app.use(express.json({limit: "16kb"}))
// app.use(express.urlencoded({extended:true,limit: "16kb"}))
// app.use(express.static("public"))
// app.use(cookieParser());

// import studentRouter from "./routes/student.route.js"
// import teacherRouters from "./routes/teacher.route.js"

// app.use("/api/v1/student",studentRouter);
// app.use("/api/v1/teacher",teacherRouters);


// app.use((err, req, res, next) => {

//     res.status(err.statusCode || 500).json({
//         success: err.success || false,
//         message: err.message || "Something went wrong",
//         errors: err.errors || []
//     });
// });

// export { app };







import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

import studentRouter from "./routes/student.route.js";
import teacherRouters from "./routes/teacher.route.js";

const app = express();

// CORS configuration
app.use(cors({
    // origin: process.env.CORS_ORIGIN,
    // credentials: true
}));

// Connect to MongoDB before handling API requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

// Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));
app.use(express.static("public"));
app.use(cookieParser());

// Home route
app.get("/", (req, res) => {
    res.send("Online Exam Portal Backend is Running!");
});

// API routes
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/teacher", teacherRouters);

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: err.success || false,
        message: err.message || "Something went wrong",
        errors: err.errors || []
    });
});

// Export both for Vercel and local development
export { app };
export default app;







// import "dotenv/config";

// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";

// import studentRouter from "./routes/student.route.js";
// import teacherRouters from "./routes/teacher.route.js";

// const app = express();

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }));

// // Middlewares
// app.use(express.json({ limit: "16kb" }));

// app.use(express.urlencoded({
//     extended: true,
//     limit: "16kb"
// }));

// app.use(express.static("public"));
// app.use(cookieParser());

// // Home route
// app.get("/", (req, res) => {
//     res.send("Online Exam Portal Backend is Running!");
// });

// // API routes
// app.use("/api/v1/student", studentRouter);
// app.use("/api/v1/teacher", teacherRouters);

// // Error handling middleware
// app.use((err, req, res, next) => {
//     res.status(err.statusCode || 500).json({
//         success: err.success || false,
//         message: err.message || "Something went wrong",
//         errors: err.errors || []
//     });
// });

// export { app };
// export default app;
