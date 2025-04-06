import EventModel from "../models/event.model.js";
import NoticeModel from "../models/notice.model.js";
import ClubModel from "../models/club.model.js";
import UserModel from "../models/user.model.js";

// Event controllers
const submitEvent = async (req, res) => {
    try {
        const { name, description, date, time, location, clubId, category } = req.body;
        
        // For admin users, clubId is optional
        let club = null;
        if (clubId) {
            // Find club if clubId is provided
            club = await ClubModel.findById(clubId);
            if (!club) {
                return res.status(404).json({ 
                    success: false,
                    message: "Club not found" 
                });
            }
        }
        
        // Create event with event data
        const eventData = { 
            name, 
            description, 
            date, 
            time, 
            location,
            category: category || 'general',
            status: 'approved',
            createdBy: req.user._id,
            approvedBy: req.user._id
        };
        
        // Add club reference only if a club was found
        if (club) {
            eventData.club = clubId;
        }
        
        const event = await EventModel.create(eventData);
        
        // Add event to club's events array if club exists
        if (club) {
            await ClubModel.findByIdAndUpdate(
                clubId,
                { $addToSet: { events: event._id } }
            );
        }
        
        res.status(201).json({
            success: true,
            event
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

const getAllPendingEvents = async (req, res) => {
    try {
        const pendingEvents = await EventModel.find({ status: 'pending' })
            .populate('club', 'name')
            .populate('createdBy', 'name email');
        
        res.status(200).json({
            success: true,
            count: pendingEvents.length,
            events: pendingEvents
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

const approveOrRejectEvent = async (req, res) => {
    try {
        const { eventId, status, rejectionReason } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: "Status must be either 'approved' or 'rejected'" 
            });
        }

        const updateData = { 
            status,
            approvedBy: req.user._id
        };

        // Add rejection reason if provided and status is rejected
        if (status === 'rejected' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const event = await EventModel.findByIdAndUpdate(
            eventId, 
            updateData,
            { new: true }
        ).populate('club', 'name')
         .populate('createdBy', 'name email');
        
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: "Event not found" 
            });
        }

        // If approved, add event to club's events array
        if (status === 'approved') {
            await ClubModel.findByIdAndUpdate(
                event.club._id,
                { $addToSet: { events: event._id } }
            );
        }
        
        res.status(200).json({
            success: true,
            event
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

// Notice controllers
const postNotice = async (req, res) => {
    try {
        const { title, content, category, clubId, isAdminNotice } = req.body;
        
        // For admin notices, clubId is optional
        let club = null;
        if (clubId && !isAdminNotice) {
            // Find club if clubId is provided and not an admin notice
            club = await ClubModel.findById(clubId);
            if (!club) {
                return res.status(404).json({ 
                    success: false,
                    message: "Club not found" 
                });
            }
        }
        
        // Create notice data
        const noticeData = { 
            title, 
            content, 
            category: category || 'general',
            status: 'approved', // Auto-approve admin notices
            createdBy: req.user._id,
            approvedBy: req.user._id
        };
        
        // Add club reference only if a club was found and this is not an admin notice
        if (club && !isAdminNotice) {
            noticeData.club = clubId;
        }
        
        const notice = await NoticeModel.create(noticeData);
        
        // Add notice to club's notices array if applicable
        if (club && !isAdminNotice) {
            await ClubModel.findByIdAndUpdate(
                clubId,
                { $addToSet: { notices: notice._id } }
            );
        }
        
        res.status(201).json({
            success: true,
            notice
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

const editNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        const updateData = req.body;
        
        const notice = await NoticeModel.findByIdAndUpdate(
            noticeId,
            updateData,
            { new: true }
        );
        
        if (!notice) {
            return res.status(404).json({ 
                success: false,
                message: "Notice not found" 
            });
        }
        
        res.status(200).json({
            success: true,
            notice
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

const removeNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        
        const notice = await NoticeModel.findByIdAndDelete(noticeId);
        
        if (!notice) {
            return res.status(404).json({ 
                success: false,
                message: "Notice not found" 
            });
        }
        
        // If associated with a club, remove from club's notices array
        if (notice.club) {
            await ClubModel.findByIdAndUpdate(
                notice.club,
                { $pull: { notices: noticeId } }
            );
        }
        
        res.status(200).json({
            success: true,
            message: "Notice removed successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

const getAllPendingNotices = async (req, res) => {
    try {
        const pendingNotices = await NoticeModel.find({ status: 'pending' })
            .populate('club', 'name')
            .populate('createdBy', 'name email');
        
        res.status(200).json({
            success: true,
            count: pendingNotices.length,
            notices: pendingNotices
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

const approveOrRejectNotice = async (req, res) => {
    try {
        const { noticeId, status, rejectionReason } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: "Status must be either 'approved' or 'rejected'" 
            });
        }

        const updateData = { 
            status, 
            approvedBy: req.user._id
        };

        // Add rejection reason if provided and status is rejected
        if (status === 'rejected' && rejectionReason) {
            updateData.rejectionReason = rejectionReason;
        }

        const notice = await NoticeModel.findByIdAndUpdate(
            noticeId, 
            updateData,
            { new: true }
        ).populate('club', 'name')
         .populate('createdBy', 'name email');
        
        if (!notice) {
            return res.status(404).json({ 
                success: false,
                message: "Notice not found" 
            });
        }

        // If approved and club exists, add notice to club's notices array
        if (status === 'approved' && notice.club) {
            await ClubModel.findByIdAndUpdate(
                notice.club._id,
                { $addToSet: { notices: notice._id } }
            );
        }
        
        res.status(200).json({
            success: true,
            notice
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

// Club management
const createClub = async (req, res) => {
    try {
        const { name, description, coordinatorEmail } = req.body;
        
        // Check if club with name already exists
        const existingClub = await ClubModel.findOne({ name });
        if (existingClub) {
            return res.status(409).json({ 
                success: false,
                message: "Club with this name already exists" 
            });
        }

        // Find coordinator user
        let coordinator = await UserModel.findOne({ email: coordinatorEmail });
        
        if (!coordinator) {
            return res.status(404).json({ 
                success: false,
                message: "User with this email not found" 
            });
        }
        
        // Update user role to club-coordinator if not already
        if (coordinator.role !== 'club-coordinator') {
            coordinator = await UserModel.findByIdAndUpdate(
                coordinator._id,
                { role: 'club-coordinator' },
                { new: true }
            );
        }

        // Create club
        const club = await ClubModel.create({
            name,
            description,
            coordinator: coordinator._id,
            members: [coordinator._id]
        });

        // Add club to user's clubMemberships
        await UserModel.findByIdAndUpdate(
            coordinator._id,
            { 
                clubAffiliation: club.name,
                $addToSet: { clubMemberships: club._id } 
            }
        );
        
        res.status(201).json({
            success: true,
            club
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find().select('-password -refreshToken');
        
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

// Change user role
const changeUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        
        if (!['student', 'club-coordinator', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false,
                message: "Role must be either 'student', 'club-coordinator', or 'admin'" 
            });
        }
        
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password -refreshToken');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
        
        res.status(200).json({
            success: true,
            message: `User role changed to ${role} successfully`,
            user
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

export { 
    submitEvent,
    approveOrRejectEvent,
    postNotice,
    editNotice,
    removeNotice,
    getAllPendingEvents,
    getAllPendingNotices,
    approveOrRejectNotice,
    createClub,
    getAllUsers,
    changeUserRole
};
