import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { Exam } from "../models/exam.model.js"
import { Question } from "../models/question.model.js"
import { Result } from "../models/result.model.js"


const generateAccessAndRefreshToken = async (userId) => {

    try {

        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        // console.log(error)
        throw new ApiError(500, "Something went wrong while generating access annd refresh token")
    }
}

const calculateSocre = async (answers, negativeMarks) => {

    try {
        let score = 0;
        for (const [questionId, ans] of Object.entries(answers)) {
            const question = await Question.findById(questionId);

            if (!question) {
                continue;
            }

            if (question.correctAnswer === ans) {
                score += 4;
            } else {
                score -= negativeMarks;
            }
        }

        return score;

    } catch (error) {
        console.log(error)
    }
}

const generateUsername = (email, rollNumber) => {
    rollNumber = rollNumber === undefined ? "" : rollNumber;
    let uname = "";
    for (let i = 0; i < email.length; i++) {
        if (email[i] !== '@') {
            uname += email[i];
        } else {
            uname += rollNumber;
            break;
        }
    }

    // console.log(email, rollNumber, uname, typeof (uname))
    return uname;
}


const validatePassword = (password) => {

    if (!password) {
        return "Password is required";
    }

    if (password.length < 8) {
        return "Password must be at least 8 characters long";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number";
    }

    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/~`;'&]/.test(password)) {
        return "Password must contain at least one special character";
    }

    if (/\s/.test(password)) {
        return "Password must not contain spaces";
    }

    return null; 
};

const registerUser = asyncHandler(async (req, res) => {

    // getting data
    // console.log(req.body)
    const { fullName, email, rollNumber, role, password } = req.body

    // checkiing if any empty field
    if (fullName === "") {
        throw new ApiError(400, "Full Name is required");
    }
    if (role === "teacher" && email === "") {
        throw new ApiError(400, "Email is required");
    }
    if (role === "student" && rollNumber === "") {
        throw new ApiError(400, "Roll Number is required");
    }
    if (password === "") {
        throw new ApiError(400, "Password is required");
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        throw new ApiError(400, passwordError);
    }

    // Checking if user already exist 
    const existedUser = await User.findOne({
        role,
        $or: [
            ...(rollNumber ? [{ rollNumber }] : []),
            { email }
        ]
    })
    // console.log(rollNumber, email)
    if (role === "teacher" && existedUser) {
        console.log(existedUser)
        throw new ApiError(404, "User with Email already exist")

    }
    if (role === "student" && existedUser) {
        throw new ApiError(404, "User with Email or Roll Number already exist")

    }
    const uname = generateUsername(email, rollNumber);
    // console.log(uname)
    // creating user on database
    let uu = {};
    if (role === "teacher") {
        uu = {
            fullName,
            email,
            password,
            role,
            username: uname
        }
    } else {
        uu = {
            fullName,
            email,
            rollNumber,
            password,
            role,
            username: uname
        }
    }
    const user = await User.create(uu);
    // console.log("hello")
    // removing sensitive information before sending it on response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    // checking if user is created successfully or not
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")

    }

    // returniing response
    return res.status(200).json(
        new ApiResponse(201, createdUser, "User Registered successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {

    const { email, rollNumber, password, role } = req.body

    if (role === "student" && !rollNumber) {
        throw new ApiError(400, "Roll number is required");
    }
    if (role === "teacher" && !email) {
        throw new ApiError(400, "Email is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        role,
        $or: [
            ...(rollNumber ? [{ rollNumber }] : []),
            { email }
        ]
    })

    if (!user) {
        throw new ApiError(404, `This ${role} does not exist`)
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if (!isPasswordvalid) {
        throw new ApiError(401, "Incorrect Password")
    }

    // console.log(user._id)
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedinUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    loggedinUser, accessToken, refreshToken
                },
                "User Logged In Successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged Out"))
})

const userDashboard = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "Current User fetched successfully")
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingAccessToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incommingAccessToken) {
        throw new ApiError(401, "Unauthoried access")
    }

    try {
        const decodedToken = jwt.verify(incommingAccessToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incommingAccessToken !== user.refreshToken) {
            throw new ApiError(401, "refresh token expired or already used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(200,
                    { accessToken, refreshToken: newrefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid refresh token")
    }
})

const allExam = asyncHandler(async (req, res) => {

    const { role, rollNumber } = req.user;
    if (role === "teacher") {
        throw new ApiError(404, "You are Not a student");
    }

    const exam = await Exam.find()
        .limit(6)
        .sort({ createdAt: -1 })
        .select("-password")
        .populate("createdBy");


    return res
        .status(200)
        .json(
            new ApiResponse(200, exam, "All Exams")
        )

})

const findExam = asyncHandler(async (req, res) => {
    const { keyword } = req.quary

    const exams = await Exam.find({
        title: { $regex: keyword, $options: "i" }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, exams, "Required exams"));
})

const attendExam = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { password } = req.body
    const exam = await Exam.findById(examId)

    if (exam.status === "Deactivated") {
        throw new ApiError(404, "This exam is currently inactive.")
    }
    const isPasswordValid = await exam.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(404, "Incorrect Password")
    }
    const student = await User.findById(req.user._id).select("-password -refreshToken")
    // console.log(student.attemptedExams)
    const alreadyAttempted = student.attemptedExams.some(
        (attempt) => attempt.toString() === examId
    );

    if (alreadyAttempted) {
        throw new ApiError(400, "You have already attempted this exam");
    }
    student.attemptedExams.push(examId)

    const examData = await Exam.findById(examId).select("-password").populate("questions")



    await student.save({ validateBeforeSave: true })



    return res
        .status(200)
        .json(new ApiResponse(200, examData, "Exam fetched successfully"));
})

const attemptedExams = asyncHandler(async (req, res) => {
    // const user = req.user;

    const user = await User.findById(req.user._id).select("-password").populate("attemptedExams").limit(5)
    // console.log(user.attemptedExams)
    return res
        .status(200)
        .json(new ApiResponse(200, user.attemptedExams, "Attempted exams featched successfully"))
})

const submitExams = asyncHandler(async (req, res) => {

    const { answers, examId } = req.body;
    const student = await User.findById(req.user._id).select("-password -refreshToken")
    const exam = await Exam.findById(examId).select("-password -refreshToken")

    // console.log(answers)
    let score = await calculateSocre(answers, exam?.negativeMarks);
    // console.log(score);
    const totalScore = exam.questions.length * 4;
    const result = await Result.create({
        student,
        exam: examId,
        scoreObtained: score,
        totalScore,
        attemptedQuestions: Object.entries(answers).length
    })

    exam.rankings.push(result._id);
    exam.totalAttempts = exam.totalAttempts + 1;
    await exam.save();

    if (!result) {
        throw new ApiError(404, "Something Went Wrong")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Exam Submitted Successfully"))

})


const removeFromAttemptedExam = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id).select("-password -refreshToken")

    // console.log(user.attemptedExams)
    return res
        .status(200)
        .json(new ApiResponse(200, user.attemptedExams, "Successfully removed"))
})


const myResults = asyncHandler(async (req, res) => {

    const results = await Result
        .find({ student: req.user._id })
        .populate({
            path: "exam",
            populate: {
                path: "createdBy",
                select: "fullName email"
            }
        })
        .limit(5)
    return res
        .status(200)
        .json(new ApiResponse(200, results, "result successfully fetched"))
})


const searchExams = asyncHandler(async (req, res) => {
    const { query } = req.query

    if (!query) {
        throw new ApiError(404, "Queery is required");
    }


    const exams = await Exam.find({
        title: {
            $regex: query,
            $options: "i"
        }
    }).select("-password").populate("createdBy", "-password -refreshToken")



    return res
        .status(200)
        .json(new ApiResponse(200, exams, "Exams fetched successfully"));

})


const searchResult = asyncHandler(async (req, res) => {
    const { query } = req.query

    // console.log("Hello", query)
    if (!query) {
        throw new ApiError(404, "Query is required");
    }


    const results = await Result.find({
        student: req.user._id
    }).populate({
        path: "exam",
        match: {
            title: {
                $regex: query,
                $options: "i"
            }
        }
    })
        .limit(5);

    const filteredResults = results.filter(
        result => result.exam !== null
    );
    // console.log(results)
    return res
        .status(200)
        .json(new ApiResponse(200, filteredResults, "Result fetched successfully"));

})


const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    const user = await User.findById(req.user._id).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if (!fullName) {
        throw new ApiError(404, "Full Name is required")
    }
    if (!email) {
        throw new ApiError(404, "Email is required")
    }
    user.fullName = fullName
    user.email = email
    const username = generateUsername(email, user.fullName);
    user.username = username
    await user.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Profile Updated Successfully"))
})


const changePassword = asyncHandler(async (req, res) => {
    const { newPassword, currentPassword } = req.body

    const user = await User.findById(req.user._id);
    const isPasswordvalid = await user.isPasswordCorrect(currentPassword)
    if (!isPasswordvalid) {
        throw new ApiError(404, "Incorrect password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: true });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Successfully"))

})


export {
    registerUser,
    loginUser,
    logoutUser,
    userDashboard,
    refreshAccessToken,
    allExam,
    findExam,
    attendExam,
    attemptedExams,
    removeFromAttemptedExam,
    submitExams,
    myResults,
    searchExams,
    updateProfile,
    changePassword,
    searchResult
}