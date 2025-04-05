// acdemics updates, fee deadlines, club announcements, campus events, etc

import mongoose from "mongoose";

const noticeSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    dueDate: {
        type: Date,
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    rejectionReason: {
        type: String,
        default: null,
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        default: null,
    }
}, { timestamps: true });

const NoticeModel = mongoose.model('Notice', noticeSchema);
export default NoticeModel;


