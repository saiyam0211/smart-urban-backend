// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const { sendOtpEmail } = require('../utils/emailService');
const { sendOtpSms } = require('../utils/smsService');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate OTP
router.post('/generate-otp', async (req, res) => {
    try {
        const { phone, email, method } = req.body;
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with 5 minutes expiry
        const key = method === 'email' ? email : phone;
        otpStore.set(key, {
            otp,
            expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
            attempts: 0
        });

        try {
            if (method === 'email' && email) {
                // Send OTP via email
                await sendOtpEmail(email, otp);
            } else if (method === 'sms' && phone) {
                // Send OTP via SMS
                await sendOtpSms(phone, otp);
            } else {
                throw new Error('Invalid notification method or missing contact information');
            }

            res.json({ 
                message: `OTP sent successfully via ${method}`,
                sentTo: method === 'email' ? email : phone
            });
        } catch (error) {
            console.error('Failed to send OTP:', error);
            throw new Error(`Failed to send OTP via ${method}`);
        }
    } catch (error) {
        console.error('OTP generation error:', error);
        res.status(500).json({ error: error.message || 'Failed to send OTP' });
    }
});

// Verify OTP and Login/Register
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, email, otp, name, userType, method } = req.body;
        
        const key = method === 'email' ? email : phone;
        const storedOTPData = otpStore.get(key);

        // Validate OTP
        if (!storedOTPData) {
            return res.status(400).json({ error: 'No OTP found. Please request a new OTP.' });
        }

        if (storedOTPData.expiry < Date.now()) {
            otpStore.delete(key);
            return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
        }

        if (storedOTPData.otp !== otp) {
            storedOTPData.attempts += 1;
            if (storedOTPData.attempts >= 3) {
                otpStore.delete(key);
                return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
            }
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Clear used OTP
        otpStore.delete(key);

        // Find or create user
        let user;
        const searchQuery = method === 'email' ? { email } : { phone };
        
        if (userType === 'user') {
            user = await User.findOne(searchQuery);
            if (!user) {
                user = await User.create({
                    ...searchQuery,
                    name,
                    address: 'Default Address',
                    location: {
                        type: 'Point',
                        coordinates: [0, 0]
                    }
                });
            }
        } else {
            user = await Volunteer.findOne(searchQuery);
            if (!user) {
                user = await Volunteer.create({
                    ...searchQuery,
                    name
                });
            }
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, type: userType },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                type: userType
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

module.exports = router;