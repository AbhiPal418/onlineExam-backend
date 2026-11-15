import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
})));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true,limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());

import studentRouter from "./routes/student.route.js"
import teacherRouters from "./routes/teacher.route.js"

app.use("/api/v1/student",studentRouter);
app.use("/api/v1/teacher",teacherRouters);


app.use((err, req, res, next) => {

    res.status(err.statusCode || 500).json({
        success: err.success || false,
        message: err.message || "Something went wrong",
        errors: err.errors || []
    });
});

export { app };