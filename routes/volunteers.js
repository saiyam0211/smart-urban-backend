const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Volunteer = require('../models/Volunteer');
const Problem = require('../models/Problem');

// Get volunteer profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.user.id)
            .select('-__v')
            .populate('problemsSolved');
        res.json(volunteer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get assigned problems
router.get('/assigned-problems', authMiddleware, async (req, res) => {
    try {
        const problems = await Problem.find({ assignedTo: req.user.id })
            .populate('reportedBy', 'name')
            .sort('-createdAt');
        res.json(problems);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update volunteer profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const volunteer = await Volunteer.findByIdAndUpdate(
            req.user.id,
            { name },
            { new: true }
        ).select('-__v');
        res.json(volunteer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
