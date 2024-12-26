const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, sparse: true },
    email: { type: String, sparse: true },
    address: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    contributions: { type: Number, default: 0 },
    problemsReported: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }]
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);