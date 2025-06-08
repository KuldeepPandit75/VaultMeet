const express=require('express');
const router=express.Router();
const {body}=require('express-validator');
const userController=require('../controllers/user.controller');
const authMiddleware=require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');

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

router.put('/update',authMiddleware,userController.updateUser);

router.get('/check-username/:username',userController.checkUsernameAvailability);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req: any, file: any, cb: any) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// New routes for image uploads
router.put('/banner', authMiddleware, upload.single('banner'), userController.updateBanner);
router.put('/avatar', authMiddleware, upload.single('avatar'), userController.updateProfilePicture);

// Google login route
router.post('/google-login', userController.googleLogin);

module.exports=router;