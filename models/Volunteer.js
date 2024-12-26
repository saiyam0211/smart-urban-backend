const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, sparse: true },
    email: { type: String, sparse: true },
    points: { type: Number, default: 0 },
    problemsSolved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }]
});

module.exports = mongoose.model('Volunteer', volunteerSchema);