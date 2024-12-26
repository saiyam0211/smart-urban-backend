// backend/utils/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials are not properly configured');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendOtpEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `Urban Resource Management <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your OTP for Urban Resource Management',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1a73e8; margin-bottom: 20px; text-align: center;">Your OTP Verification Code</h2>
                        <p style="color: #333; font-size: 16px; line-height: 1.5;">Hello,</p>
                        <p style="color: #333; font-size: 16px; line-height: 1.5;">Your OTP for Urban Resource Management login is:</p>
                        <div style="background-color: #f0f7ff; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #1a73e8; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
                        </div>
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">This OTP will expire in 5 minutes.</p>
                        <p style="color: #666; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
                        <div style="border-top: 1px solid #eee; margin-top: 20px; padding-top: 20px;">
                            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated message, please do not reply.</p>
                        </div>
                    </div>
                </div>
            `
        };

        console.log('Attempting to send email to:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        
        return info;

    } catch (error) {
        console.error('Email sending error:', {
            message: error.message,
            code: error.code,
            command: error.command
        });

        // Handle specific email errors
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Check Gmail credentials.');
        } else if (error.code === 'ESOCKET') {
            throw new Error('Network error while sending email.');
        } else {
            throw new Error('Failed to send email. Please try SMS OTP instead.');
        }
    }
};

// For development/testing purposes
const testEmailConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('Email service is ready');
        return true;
    } catch (error) {
        console.error('Email service failed:', error);
        return false;
    }
};

module.exports = { sendOtpEmail, testEmailConnection };