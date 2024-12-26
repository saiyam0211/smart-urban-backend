const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { 
        type: String, 
        required: true,
        enum: ['waste', 'air_pollution', 'water_pollution', 'noise_pollution', 'other']
    },
    points: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'assigned', 'in_progress', 'solved'],
        default: 'pending'
    },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    photoUrl: { type: String, required: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
    createdAt: { type: Date, default: Date.now }
});

// Create indexes for geospatial queries
problemSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Problem', problemSchema);