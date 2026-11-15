import { Router } from "express";
import { verifyJWTForTeacher,verifyJWT } from "../middlewares/auth.middleware.js";
import {
    loginUser, 
    registerUser, 
    userDashboard } from "../controllers/student.controller.js";
import {  
    changeExamStatus, 
    changePassword, 
    createExams,
    deleteExam,
    editExam,
    getActiveExams,
    getAllCreatedExams,
    getExam,
    logoutUser, 
    resultForExam, 
    searchTeacherExams,
    totalAttemptInExam,
    updateTeacherProfile} from "../controllers/teacher.controller.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/dashboard').get(verifyJWT,userDashboard);
router.route('/create-exam').post(verifyJWT,verifyJWTForTeacher,createExams)
router.route('/created-exams').get(verifyJWT,verifyJWTForTeacher,getAllCreatedExams)
router.route('/delete-exam/:examId').post(verifyJWT,verifyJWTForTeacher,deleteExam)
router.route('/get-exam/:examId').get(verifyJWT,verifyJWTForTeacher,getExam)
router.route('/change-status/:examId').post(verifyJWT,verifyJWTForTeacher,changeExamStatus)
router.route('/result-for/:examId').get(verifyJWT,verifyJWTForTeacher,resultForExam)
router.route('/edit-exam/:examId').post(verifyJWT,verifyJWTForTeacher,editExam)
router.route('/search-exams').get(verifyJWT,verifyJWTForTeacher,searchTeacherExams)
router.route('/change-password').patch(verifyJWT,verifyJWTForTeacher,changePassword)
router.route('/update-profile').post(verifyJWT,verifyJWTForTeacher,updateTeacherProfile)
router.route('/active-exams').get(verifyJWT,verifyJWTForTeacher,getActiveExams)
router.route('/total-attempt-in-exams').get(verifyJWT,verifyJWTForTeacher,totalAttemptInExam)


export default router;

