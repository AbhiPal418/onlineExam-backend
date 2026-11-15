import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Exam } from "../models/exam.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Question } from "../models/question.model.js"
import { User } from "../models/user.model.js"
import { Result } from "../models/result.model.js"


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


const createExams = asyncHandler(async (req, res) => {

    const { examData, questions } = req.body
    const teacher = req.user
    // console.log("hello",teacher._id);
    if (!examData.title) {
        throw new ApiError(404, "Title is required");
    }
    if (!examData.password) {
        throw new ApiError(404, "password is required");
    }

    if (!examData.timeLimit) {
        throw new ApiError(404, "Please set a Time Limit");
    }
    if (!examData.questionMarks) {
        throw new ApiError(404, "Add marks per question");
    }
    if (examData.negativeMarks >= examData.questionMarks) {
        throw new ApiError(404, "Negative marks should be less than marks per question");
    }
    const existedExam = await Exam.findOne({ title: examData.title, createdBy: teacher._id });
    if (existedExam) {
        // console.log("hello");
        throw new ApiError(404, `Exam created by ${teacher.fullName} and with this title already existed`);
    }


    const exam = {
        title: examData?.title,
        timeLimit: examData?.timeLimit || 0,
        questions: [],
        password: examData?.password,
        createdBy: teacher,
        totalQuestion: questions.length,
        negativeMarks: examData?.negativeMarks <= examData?.questionMarks ? examData?.negativeMarks : examData.questionMarks
    }
    // console.log("Hello")

    // const createdexamI = await Exam.findById(exam._id)    

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (!question.question) {
            throw new ApiError(404, `Please add the ${i + 1} no question`)
        }
        if (question.options.length < 4) {
            throw new ApiError(404, `Please add all options for question no ${i + 1}`)
        }
        // console.log("Hello val",typeof(question.correctAnswer))
        if (!question.correctAnswer) {
            throw new ApiError(404, `Please select a correct answer for question no ${i + 1}`)
        }
        const quest = await Question.create({
            question: question.question,
            options: question.options,
            correctAnswer: question.options[question.correctAnswer],
        })
        // console.log(quest._id)
        exam.questions.push(quest._id);
    }
    const createdExamI = await Exam.create(exam);
    const user = await User.findById(req.user._id)
    user.createdExams.push(createdExamI._id);
    // console.log(user)
    await user.save()
    const createdexam = await Exam.findById(createdExamI._id).select("-password")
    // console.log(createdexam)
    if (!createdexam) {
        throw new ApiError(404, "Something Went wrong");
    }
    return res
        .status(200)
        .json(new ApiResponse(201, createdexam, "Exam created successfully"));
})


const getAllCreatedExams = asyncHandler(async (req, res) => {

    const allExams = await Exam.find({ createdBy: req.user._id })
        .limit(5)
        .sort({ createdAt: -1 })
        .select("-password")
        .populate("rankings")

    // console.log("hello",allExams)

    return res
        .status(200)
        .json(new ApiResponse(200, allExams, "successfully fetched All exams"))
})


const deleteExam = asyncHandler(async (req, res) => {
    const { examId } = req.params

    const exam = await Exam.deleteOne({ createdBy: req.user._id, _id: examId })
    if (!exam) {
        throw new ApiError(404, "Something went wrong")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Exam deleted successfully"))
})


const editExam = asyncHandler(async (req, res) => {

    const { examData, questions } = req.body
    const { examId } = req.params
    const teacher = req.user

    const ex = await Exam.find({ createdBy: teacher._id, _id: examData._id })

    if (!ex) {
        throw new ApiError(400, "You cannot edit this exam")
    }

    if (!examData.title) {
        throw new ApiError(404, "Title is required");
    }
    // if (!examData.password) {
    //     throw new ApiError(404, "Password is required");
    // }

    if (!examData.timeLimit) {
        throw new ApiError(404, "Please set a Time Limit");
    }
    if (!examData.questionMarks) {
        throw new ApiError(404, "Add marks per question");
    }
    if (examData.negativeMarks >= examData.questionMarks) {
        throw new ApiError(404, "Negative marks should be less than marks per question");
    }

    const existedExam = await Exam.findById(examId);
    if (!existedExam) {
        throw new ApiError(404, `Exam created by ${teacher.fullName} and with this title doesn't existed`);
    }


    existedExam.title = examData?.title,
        existedExam.timeLimit = examData?.timeLimit || 0,
        existedExam.questions = [],
        existedExam.password = examData?.password ? examData.password : existedExam.password,
        existedExam.createdBy = teacher,
        existedExam.totalQuestion = questions.length,
        existedExam.negativeMarks = examData?.negativeMarks <= examData?.questionMarks ? examData?.negativeMarks : examData.questionMarks


    // const createdexamI = await Exam.findById(exam._id)

    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (!question.question) {
            throw new ApiError(404, `Please add the ${i + 1} no question`)
        }
        if (question.options.length < 4) {
            throw new ApiError(404, `Please add all options for question no ${i + 1}`)
        }
        // console.log("Hello",question.correctAnswer)
        if (!question.correctAnswer) {
            throw new ApiError(404, `Please select a correct answer for question no ${i + 1}`)
        }
        const quest = await Question.create({
            question: question.question,
            options: question.options,
            correctAnswer: question.options[question.correctAnswer],
        })
        // console.log(quest._id)
        existedExam.questions.push(quest._id);
    }
    await existedExam.save();

    const createdexam = await Exam.findById(examId).select("-password")
    // console.log(createdexam)
    if (!createdexam) {
        throw new ApiError(404, "Something Went wrong");
    }
    return res
        .status(200)
        .json(new ApiResponse(201, createdexam, "Exam edited successfully"));
})


const getExam = asyncHandler(async (req, res) => {


    const { examId } = req.params
    const exam = await Exam.findById(examId).populate("createdBy").populate("questions").select("-password").limit(5)
    if (!exam) {
        throw new ApiError(404, "Exam Not Found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, exam, "Successfully Fetched Exam"))
})


const changeExamStatus = asyncHandler(async (req, res) => {

    const { examId } = req.params

    const exam = await Exam.findOne({createdBy:req.user._id,_id:examId})
    if (!exam) {
        throw new ApiError(404, "Exam not existed ");
        
    }
    
    if (exam.status === "Active") {
        exam.status = "Deactivated";
    } else {
        exam.status = "Active"
    }
    
    await exam.save({validateBeforeSave:true});
    // console.log("Hello",exam.status)


    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Exam status change successfully"))



})


const resultForExam = asyncHandler(async (req, res) => {
    const { examId } = req.params

    // console.log("on reult ")
    const results = await Result.find({ exam: examId }).populate("student")
    if (!results) {
        throw new ApiError(404, "Error Fetching Results")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, results, "Results fetched successfully1"))
})


const searchTeacherExams = asyncHandler(async (req, res) => {
    const { query } = req.query

    if (!query) {
        throw new ApiError(404, "Queery is required");
    }

    const exams = await Exam.find({
        title: {
            $regex: query,
            $options: "i"
        },
        createdBy: req.user._id
    }).select("-password").populate("createdBy", "-password -refreshToken")



    return res
        .status(200)
        .json(new ApiResponse(200, exams, "Exams fetched successfully"));

})


const changePassword = asyncHandler(async (req, res) => {
    const { newPassword, currentPassword } = req.body

    if (!currentPassword) {
        throw new ApiError(400, "Please enter old passwrd")
    }
    if (!newPassword) {
        throw new ApiError(400, "Please enter new password")
    }
    if (newPassword === currentPassword) {
        throw new ApiError(400, "new and old password should be diffrent")

    }

    const user = await User.findById(req.user._id).select("-refreshToken")

    const isPasswordvalid = await user.isPasswordCorrect(currentPassword)
    if (!isPasswordvalid) {
        throw new ApiError(400, "Incorrect password");
    }


    user.password = newPassword
    await user.save({ validateBeforeSave: true })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Successfully changed password"))
})


const updateTeacherProfile = asyncHandler(async (req, res) => {

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

const getActiveExams = asyncHandler(async (req, res) => {

    const teacher = req.user._id
    const exams = await Exam.find({ createdBy: teacher, status: "Active" })
    return res
        .status(200)
        .json(new ApiResponse(200, exams, "Successfully get all active exams"))

})

const totalAttemptInExam = asyncHandler(async (req, res) => {
    const teacher = req.user._id

    const exams = await Exam.find({ createdBy: teacher })
    let total = 0;
    for (let i = 0; i < exams.length; i++) {
        total += exams[i].totalAttempts
    }

    return res
        .status(200)
        .json(new ApiResponse(200, total, `Total Attempts ${total}`))
})


export {
    createExams,
    logoutUser,
    getAllCreatedExams,
    deleteExam,
    getExam,
    editExam,
    changeExamStatus,
    resultForExam,
    searchTeacherExams,
    changePassword,
    updateTeacherProfile,
    getActiveExams,
    totalAttemptInExam

}