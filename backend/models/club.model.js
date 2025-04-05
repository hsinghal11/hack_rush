import mongoose from "mongoose";

const clubSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    coordinator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    membershipRequests: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        requestDate: {
            type: Date,
            default: Date.now
        }
    }],
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    notices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notice'
    }]
}, { timestamps: true });

const ClubModel = mongoose.model('Club', clubSchema);
export default ClubModel;
