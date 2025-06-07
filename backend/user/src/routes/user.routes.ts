const express=require('express');
const router=express.Router();
const {body}=require('express-validator');
const userController=require('../controllers/user.controller');
const authMiddleware=require('../middlewares/auth.middleware');

router.post('/register',[
    body('fullname.firstname').notEmpty().withMessage('First name is required').isLength({min:3}).withMessage('First name must be at least 3 characters long'),
    body('fullname.lastname').notEmpty().withMessage('Last name is required').isLength({min:3}).withMessage('Last name must be at least 3 characters long'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required').isLength({min:8}).withMessage('Password must be at least 8 characters long'),
],userController.registerUser);

router.post('/login',[
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required').isLength({min:8}).withMessage('Password must be at least 8 characters long'),
],userController.loginUser);

router.get('/profile',authMiddleware,userController.getUserProfile);

router.post('/logout',authMiddleware,userController.logoutUser);

module.exports=router;