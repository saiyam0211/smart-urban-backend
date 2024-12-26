// backend/utils/smsService.js
const twilio = require('twilio');

const sendOtpSms = async (phone, otp) => {
    try {
        // Check if Twilio credentials are configured
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
            throw new Error('Twilio credentials are not properly configured');
        }

        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        // Format phone number if it doesn't start with +
        const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

        console.log('Attempting to send SMS to:', formattedPhone);
        
        const message = await client.messages.create({
            body: `Your OTP for Urban Resource Management is: ${otp}`,
            to: formattedPhone,
            from: process.env.TWILIO_PHONE_NUMBER
        });

        console.log('SMS sent successfully. Message SID:', message.sid);
        return message;

    } catch (error) {
        console.error('SMS sending error:', {
            message: error.message,
            code: error.code,
            status: error.status,
            moreInfo: error.moreInfo
        });

        // Throw a more specific error based on the Twilio error
        if (error.code === 20003) {
            throw new Error('Authentication failed. Check Twilio credentials.');
        } else if (error.code === 21211) {
            throw new Error('Invalid phone number format. Please include country code.');
        } else if (error.code === 21608) {
            throw new Error('Phone number is not verified with Twilio trial account.');
        } else {
            throw new Error('Failed to send SMS. Please try email OTP instead.');
        }
    }
};

module.exports = { sendOtpSms };