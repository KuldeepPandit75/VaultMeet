import {
  OTP_EXPIRES_MIN,
  OTP_TRIES,
  OTP_ATTEMPTS,
  OTP_RESEND_MIN,
} from "../config/app.config.js";
import { sendMail } from "../config/mailConfig.js";
import userModel from "../models/user.model.js";
import { generateRandomNDigits } from "../helpers/generalHelper.js";
import {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
} from "crypto";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";

interface ResetTokenPayload extends JwtPayload {
  email: string;
}

export const encryptData = (otp) => {
  const iv = randomBytes(16);

  const key = createHash("sha256")
    .update(process.env.OTP_SECRET)
    .digest()
    .subarray(0, 16);

  const cipher = createCipheriv("aes-128-cbc", key, iv);
  let encryptedOtp = cipher.update(otp.toString(), "utf8", "hex");
  encryptedOtp += cipher.final("hex");

  return `${iv.toString("hex")}:${encryptedOtp}`;
};

export const decryptData = (encryptedData) => {
  const [ivHex, encryptedOtp] = encryptedData.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const key = createHash("sha256")
    .update(process.env.OTP_SECRET)
    .digest()
    .subarray(0, 16);

  const decipher = createDecipheriv("aes-128-cbc", key, iv);
  let decryptedOtp = decipher.update(encryptedOtp, "hex", "utf8");
  decryptedOtp += decipher.final("utf8");

  return +decryptedOtp;
};

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const currentTime = Date.now();
    let newExpirationTime = currentTime + OTP_EXPIRES_MIN * 60000; //minutes
    let newTries = OTP_TRIES;
    let newAttempts = OTP_ATTEMPTS;

    let otp_value = generateRandomNDigits(6);

    //if old otp has not expired resend it
    const user = await userModel.findOne({ email });
    if (user?.otp) {
      if (user.otp.tries <= 0 || user.otp.attempts <= 0)
        return res.status(403).send({
          success: false,
          message: "Too many attempts!",
        });
      const otpExpirationTime = new Date(user.otp.expiration).getTime();
      const resendOTPAfter =
        otpExpirationTime - (OTP_EXPIRES_MIN - OTP_RESEND_MIN) * 60000; //minutes
      if (currentTime < resendOTPAfter)
        return res.status(429).send({
          success: false,
          message: "Too many requests!",
        });
      if (currentTime < otpExpirationTime) {
        otp_value = decryptData(user.otp.value);
        newExpirationTime = Number(user.otp.expiration);
      } else newTries--;
      newAttempts = user.otp.attempts;
    }
    await userModel.updateOne(
      { email },
      {
        $set: {
          otp: {
            value: encryptData(otp_value),
            expiration: newExpirationTime,
            tries: newTries,
            attempts: newAttempts,
          },
        },
      },
      { runValidators: true, upsert: true }
    );

    const mailSent = await sendMail(email, otp_value);
    if (!mailSent.success) throw new Error("Error while sending mail!");

    res.status(200).send({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Error in sendOTP:", error);
    res.status(500).send({
      success: false,
      message: "Error sending OTP",
    });
  }
};

export const verifyOTP = async (req: any, res: any) => {
  const { email, otp } = req.body;
  try {
    const user = await userModel
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
    if (String(otp) !== String(decryptData(user.otp.value))) {
      await userModel.updateOne(
        { _id: user._id },
        { $inc: { "otp.attempts": -1 } },
        { runValidators: true }
      );
      return res.status(400).json({ result: "INVALID", _id: null, role: null });
    }

    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
          otp: {
            expiration: Date.now(),
            tries: OTP_TRIES,
            attempts: OTP_ATTEMPTS,
          },
        },
      },
      { runValidators: true }
    );

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email },
      process.env.OTP_SECRET as string,
      { expiresIn: "1h" }
    );

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
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

export const resetPassword = async (req: any, res: any) => {
  const token = req.cookies?.otp_token;
  const { newPassword } = req.body;
  console.log(token);

  try {
    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.OTP_SECRET as string
    ) as ResetTokenPayload;
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Find user by email from token
    const user = await userModel.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
        },
      },
      { runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
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
};
