import express from 'express';
import { createUser } from '../controllers/user-controller.js';


const router=express.Router();

router.post("/login",createUser);


router.get("/", (req, res) => {
    res.send("Server is running!");
});

export default router;