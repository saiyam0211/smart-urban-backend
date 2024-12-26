// backend/routes/problems.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Problem = require('../models/Problem');
const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const upload = require('../config/multerConfig');

// Get all problems
router.get('/', authMiddleware, async (req, res) => {
    try {
        const problems = await Problem.find()
            .populate('reportedBy', 'name')
            .populate('assignedTo', 'name')
            .sort('-createdAt');
        res.json(problems);
    } catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Error fetching problems' });
    }
});

// Get leaderboards
router.get('/leaderboards', async (req, res) => {
    try {
        const users = await User.find()
            .sort('-contributions')
            .limit(10)
            .select('name contributions');

        const volunteers = await Volunteer.find()
            .sort('-points')
            .limit(10)
            .select('name points');

        res.json({
            users,
            volunteers
        });
    } catch (error) {
        console.error('Error fetching leaderboards:', error);
        res.status(500).json({ error: 'Error fetching leaderboards' });
    }
});

// Report a new problem
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const { title, description, category, latitude, longitude } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload an image' });
        }

        // Create photo URL for local storage
        const photoUrl = `/uploads/${req.file.filename}`;

        // Calculate points based on category
        const pointsMap = {
            waste: 10,
            air_pollution: 15,
            water_pollution: 20,
            noise_pollution: 10,
            other: 5
        };

        const points = pointsMap[category] || 5;

        const problem = await Problem.create({
            title,
            description,
            category,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            photoUrl,
            reportedBy: req.user.id,
            status: 'pending',
            points
        });

        await User.findByIdAndUpdate(req.user.id, {
            $inc: { contributions: 1 },
            $push: { problemsReported: problem._id }
        });

        res.json(problem);
    } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({ error: 'Error creating problem' });
    }
});

// Update problem status
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const problem = await Problem.findById(req.params.id);

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        problem.status = status;
        
        if (status === 'assigned') {
            problem.assignedTo = req.user.id;
        }

        if (status === 'solved' && problem.assignedTo?.equals(req.user.id)) {
            await Volunteer.findByIdAndUpdate(req.user.id, {
                $inc: { points: problem.points },
                $push: { problemsSolved: problem._id }
            });
        }

        await problem.save();
        res.json(problem);
    } catch (error) {
        console.error('Error updating problem status:', error);
        res.status(500).json({ error: 'Error updating problem status' });
    }
});

module.exports = router;