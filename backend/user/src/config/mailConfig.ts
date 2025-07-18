import { createTransport } from "nodemailer";
import dotenv from "dotenv";
import { OTP_EXPIRES_MIN } from "./app.config.js";

dotenv.config();

export const sendMail = async (eMail, otp) => {
  try {
    const transport = createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.MAILER_EMAIL,
      to: eMail,
      subject: `Your VaultMeet Verification Code`,
      text: `Your verification code is: ${otp}. This code will expire in ${OTP_EXPIRES_MIN} minutes.`,
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>VaultMeet Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <!-- Header -->
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #2D3748; margin: 0; font-size: 24px;">VaultMeet</h1>
              <p style="color: #718096; margin: 10px 0 0 0; font-size: 16px;">Connect. Collaborate. Create.</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #2D3748; margin: 0 0 20px 0; font-size: 20px;">Verify Your Email</h2>
              
              <!-- OTP Box -->
              <div style="background-color: #EDF2F7; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                <p style="color: #2D3748; margin: 0 0 10px 0; font-size: 14px;">Your verification code</p>
                <div style="font-size: 32px; font-weight: bold; color: #2B6CB0; letter-spacing: 5px;">${otp}</div>
                <p style="color: #718096; margin: 10px 0 0 0; font-size: 14px;">Valid for ${OTP_EXPIRES_MIN} minutes</p>
              </div>

              <p style="color: #4A5568; margin: 0 0 20px 0; font-size: 14px; line-height: 1.5;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; border-top: 2px solid #f0f0f0; color: #718096; font-size: 14px;">
              <p style="margin: 0 0 10px 0;">© 2025 VaultMeet. All rights reserved.</p>
              <p style="margin: 0; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
      `
    };

    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};