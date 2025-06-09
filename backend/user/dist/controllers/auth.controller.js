"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyOTP = exports.sendOTP = exports.decryptData = exports.encryptData = void 0;
const app_config_js_1 = require("../config/app.config.js");
const mailConfig_js_1 = require("../config/mailConfig.js");
const user_model_js_1 = __importDefault(require("../models/user.model.js"));
const generalHelper_js_1 = require("../helpers/generalHelper.js");
const crypto_1 = require("crypto");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const encryptData = (otp) => {
    const iv = (0, crypto_1.randomBytes)(16);
    const key = (0, crypto_1.createHash)("sha256")
        .update(process.env.OTP_SECRET)
        .digest()
        .subarray(0, 16);
    const cipher = (0, crypto_1.createCipheriv)("aes-128-cbc", key, iv);
    let encryptedOtp = cipher.update(otp.toString(), "utf8", "hex");
    encryptedOtp += cipher.final("hex");
    return `${iv.toString("hex")}:${encryptedOtp}`;
};
exports.encryptData = encryptData;
const decryptData = (encryptedData) => {
    const [ivHex, encryptedOtp] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = (0, crypto_1.createHash)("sha256")
        .update(process.env.OTP_SECRET)
        .digest()
        .subarray(0, 16);
    const decipher = (0, crypto_1.createDecipheriv)("aes-128-cbc", key, iv);
    let decryptedOtp = decipher.update(encryptedOtp, "hex", "utf8");
    decryptedOtp += decipher.final("utf8");
    return +decryptedOtp;
};
exports.decryptData = decryptData;
const sendOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }
        const currentTime = Date.now();
        let newExpirationTime = currentTime + app_config_js_1.OTP_EXPIRES_MIN * 60000; //minutes
        let newTries = app_config_js_1.OTP_TRIES;
        let newAttempts = app_config_js_1.OTP_ATTEMPTS;
        let otp_value = (0, generalHelper_js_1.generateRandomNDigits)(6);
        //if old otp has not expired resend it
        const user = yield user_model_js_1.default.findOne({ email });
        if (user === null || user === void 0 ? void 0 : user.otp) {
            if (user.otp.tries <= 0 || user.otp.attempts <= 0)
                return res.status(403).send({
                    success: false,
                    message: "Too many attempts!",
                });
            const otpExpirationTime = new Date(user.otp.expiration).getTime();
            const resendOTPAfter = otpExpirationTime - (app_config_js_1.OTP_EXPIRES_MIN - app_config_js_1.OTP_RESEND_MIN) * 60000; //minutes
            if (currentTime < resendOTPAfter)
                return res.status(429).send({
                    success: false,
                    message: "Too many requests!",
                });
            if (currentTime < otpExpirationTime) {
                otp_value = (0, exports.decryptData)(user.otp.value);
                newExpirationTime = Number(user.otp.expiration);
            }
            else
                newTries--;
            newAttempts = user.otp.attempts;
        }
        yield user_model_js_1.default.updateOne({ email }, {
            $set: {
                otp: {
                    value: (0, exports.encryptData)(otp_value),
                    expiration: newExpirationTime,
                    tries: newTries,
                    attempts: newAttempts,
                },
            },
        }, { runValidators: true, upsert: true });
        const mailSent = yield (0, mailConfig_js_1.sendMail)(email, otp_value);
        if (!mailSent.success)
            throw new Error("Error while sending mail!");
        res.status(200).send({
            success: true,
            message: "OTP sent successfully.",
        });
    }
    catch (error) {
        console.error("Error in sendOTP:", error);
        res.status(500).send({
            success: false,
            message: "Error sending OTP",
        });
    }
});
exports.sendOTP = sendOTP;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    try {
        const user = yield user_model_js_1.default
            .findOne({
            email,
            "otp.expiration": { $gt: Date.now() },
        })
            .select("_id otp isVerified role email");
        if (!user) {
            return res
                .status(400)
                .json({ result: "OTP_EXPIRED", _id: null, role: null });
        }
        if (user.otp.attempts <= 0) {
            return res
                .status(400)
                .json({ result: "EXHAUSTED", _id: null, role: null });
        }
        if (String(otp) !== String((0, exports.decryptData)(user.otp.value))) {
            yield user_model_js_1.default.updateOne({ _id: user._id }, { $inc: { "otp.attempts": -1 } }, { runValidators: true });
            return res.status(400).json({ result: "INVALID", _id: null, role: null });
        }
        yield user_model_js_1.default.updateOne({ _id: user._id }, {
            $set: {
                isVerified: true,
                otp: {
                    expiration: Date.now(),
                    tries: app_config_js_1.OTP_TRIES,
                    attempts: app_config_js_1.OTP_ATTEMPTS,
                },
            },
        }, { runValidators: true });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ email: user.email }, process.env.OTP_SECRET, { expiresIn: "1h" });
        const result = !user.isVerified
            ? { result: "VERIFIED", _id: user._id, role: user.role, token }
            : { result: "VALID", _id: user._id, role: user.role, token };
        res.cookie("otp_token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 3600000,
            path: "/",
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: "Error verifying OTP" });
    }
});
exports.verifyOTP = verifyOTP;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.otp_token;
    const { newPassword } = req.body;
    console.log(token);
    try {
        // Verify the token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.OTP_SECRET);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
        // Find user by email from token
        const user = yield user_model_js_1.default.findOne({ email: decoded.email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Hash the new password
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, salt);
        // Update password
        yield user_model_js_1.default.updateOne({ _id: user._id }, {
            $set: {
                password: hashedPassword,
            },
        }, { runValidators: true });
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        console.error("Password reset error:", error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        res.status(500).json({
            success: false,
            message: "Error resetting password",
        });
    }
});
exports.resetPassword = resetPassword;
