import EventModel from "../models/event.model.js";
import NoticeModel from "../models/notice.model.js";
import ClubModel from "../models/club.model.js";
import UserModel from "../models/user.model.js";

// Event management
const submitEvent = async (req, res) => {
    try {
        const { name, description, date, time, location, clubId, isAdminEvent } = req.body;
        
        // Check if club exists
        const club = await ClubModel.findById(clubId);
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }
        
        // For regular coordinators, verify they are coordinator of this club
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && club.coordinator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to create events for this club" 
            });
        }
        
        // Create the event with appropriate status
        // Auto-approve if created by admin or isAdminEvent flag is set
        const status = isAdmin || isAdminEvent ? 'approved' : 'pending';
        
        const event = await EventModel.create({
            name,
            description,
            date,
            time,
            location,
            club: clubId,
            createdBy: req.user._id,
            status: status,
            // If admin is creating and auto-approving, also set the approvedBy field
            ...(status === 'approved' ? { approvedBy: req.user._id } : {})
        });
        
        // If event is approved, add it to the club's events array
        if (status === 'approved') {
            await ClubModel.findByIdAndUpdate(
                clubId,
                { $addToSet: { events: event._id } }
            );
        }
        
        res.status(201).json({
            success: true,
            message: status === 'approved' ? "Event created successfully" : "Event submitted for approval",
            event
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const updateData = req.body;
        
        // Find the event
        const event = await EventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: "Event not found" 
            });
        }
        
        // Check if the user is the creator of the event
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to update this event" 
            });
        }
        
        // If event is already approved, don't allow updates
        if (event.status === 'approved') {
            return res.status(400).json({ 
                success: false,
                message: "Cannot update an approved event. Please contact admin." 
            });
        }
        
        // Update the event
        const updatedEvent = await EventModel.findByIdAndUpdate(
            eventId,
            { ...updateData, status: 'pending' }, // Reset to pending since it was modified
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Event updated and submitted for approval",
            event: updatedEvent
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const getClubEvents = async (req, res) => {
    try {
        const { clubId } = req.params;
        
        // Find club
        const club = await ClubModel.findById(clubId);
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }
        
        // Check if user is coordinator of the club
        if (club.coordinator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to view this club's events" 
            });
        }
        
        // Get all events for the club including pending ones
        const events = await EventModel.find({ club: clubId });
        
        res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Notice management
const submitNotice = async (req, res) => {
    try {
        const { title, content, category, dueDate, clubId, isAdminNotice } = req.body;
        
        // Convert content to description
        const description = content;
        
        // Check if club exists
        const club = await ClubModel.findById(clubId);
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }
        
        // For regular coordinators, verify they are coordinator of this club
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && club.coordinator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to create notices for this club" 
            });
        }
        
        // Create the notice with appropriate status
        // Auto-approve if created by admin or isAdminNotice flag is set
        const status = isAdmin || isAdminNotice ? 'approved' : 'pending';
        
        const notice = await NoticeModel.create({
            title,
            description,
            category,
            dueDate,
            club: clubId,
            createdBy: req.user._id,
            status: status,
            // If admin is creating and auto-approving, also set the approvedBy field
            ...(status === 'approved' ? { approvedBy: req.user._id } : {})
        });
        
        // If notice is approved, add it to the club's notices array
        if (status === 'approved') {
            await ClubModel.findByIdAndUpdate(
                clubId,
                { $addToSet: { notices: notice._id } }
            );
        }
        
        res.status(201).json({
            success: true,
            message: status === 'approved' ? "Notice created successfully" : "Notice submitted for approval",
            notice
        });
    } catch (error) {
        console.error('Error creating notice:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const updateNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        const updateData = req.body;
        
        // Find the notice
        const notice = await NoticeModel.findById(noticeId);
        if (!notice) {
            return res.status(404).json({ 
                success: false,
                message: "Notice not found" 
            });
        }
        
        // Check if the user is the creator of the notice
        if (notice.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to update this notice" 
            });
        }
        
        // If notice is already approved, don't allow updates
        if (notice.status === 'approved') {
            return res.status(400).json({ 
                success: false,
                message: "Cannot update an approved notice. Please contact admin." 
            });
        }
        
        // Update the notice
        const updatedNotice = await NoticeModel.findByIdAndUpdate(
            noticeId,
            { ...updateData, status: 'pending' }, // Reset to pending since it was modified
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Notice updated and submitted for approval",
            notice: updatedNotice
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const getClubNotices = async (req, res) => {
    try {
        const { clubId } = req.params;
        
        // Find club
        const club = await ClubModel.findById(clubId);
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }
        
        // Check if user is coordinator of the club
        if (club.coordinator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to view this club's notices" 
            });
        }
        
        // Get all notices for the club including pending ones
        const notices = await NoticeModel.find({ club: clubId });
        
        res.status(200).json({
            success: true,
            count: notices.length,
            notices
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Club management
const getMyClub = async (req, res) => {
    try {
        // Find clubs where user is coordinator
        const clubs = await ClubModel.find({ coordinator: req.user._id })
            .populate('members', 'name email')
            .populate('events')
            .populate('notices')
            .populate({
                path: 'membershipRequests.user',
                select: 'name email'
            });
        
        if (clubs.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "You are not a coordinator of any club" 
            });
        }
        
        res.status(200).json({
            success: true,
            clubs
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const updateClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        const { name, description } = req.body;
        
        // Find club
        const club = await ClubModel.findById(clubId);
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }
        
        // Check if user is coordinator of the club
        if (club.coordinator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to update this club" 
            });
        }
        
        // Update the club
        const updatedClub = await ClubModel.findByIdAndUpdate(
            clubId,
            { name, description },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            club: updatedClub
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Membership request management
const getMembershipRequests = async (req, res) => {
    try {
        console.log('Fetching membership requests for club:', req.params.clubId);
        const { clubId } = req.params;
        
        // Find club
        const club = await ClubModel.findById(clubId)
            .populate({
                path: 'membershipRequests.user',
                select: 'name email'
            });
            
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }
        
        // Check if user is coordinator of the club
        if (club.coordinator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to view this club's membership requests" 
            });
        }
        
        console.log('Club membership requests:', club.membershipRequests);
        
        // Get pending membership requests
        const pendingRequests = club.membershipRequests
            .filter(request => request.status === 'pending')
            .map(request => {
                // Ensure we format the data correctly
                return {
                    _id: request._id,
                    user: request.user,
                    name: request.user ? request.user.name : 'Unknown User',
                    email: request.user ? request.user.email : 'No Email',
                    status: request.status,
                    requestDate: request.requestDate
                };
            });
        
        console.log('Formatted pending requests:', pendingRequests);
        
        res.status(200).json({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests
        });
    } catch (error) {
        console.error('Error fetching membership requests:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

const respondToMembershipRequest = async (req, res) => {
    try {
        const { clubId, requestId, status } = req.body;
        
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: "Status must be either 'accepted' or 'rejected'" 
            });
        }
        
        // Find club
        const club = await ClubModel.findById(clubId);
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }
        
        // Check if user is an admin or coordinator of the club
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && club.coordinator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: "You are not authorized to manage this club's membership requests" 
            });
        }
        
        // Find the specific request
        const requestIndex = club.membershipRequests.findIndex(
            request => request._id.toString() === requestId
        );
        
        if (requestIndex === -1) {
            return res.status(404).json({ 
                success: false,
                message: "Membership request not found" 
            });
        }
        
        // Update request status
        club.membershipRequests[requestIndex].status = status;
        
        // If accepted, add user to members
        if (status === 'accepted') {
            const userId = club.membershipRequests[requestIndex].user;
            
            // Check if user is already a member
            if (!club.members.includes(userId)) {
                club.members.push(userId);
                
                // Add club to user's memberships
                await UserModel.findByIdAndUpdate(
                    userId,
                    { $addToSet: { clubMemberships: club._id } }
                );
            }
        }
        
        // Save updated club
        await club.save();
        
        res.status(200).json({
            success: true,
            message: `Membership request ${status}`
        });
    } catch (error) {
        console.error('Error responding to membership request:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

export {
    submitEvent,
    updateEvent,
    getClubEvents,
    submitNotice,
    updateNotice,
    getClubNotices,
    getMyClub,
    updateClub,
    getMembershipRequests,
    respondToMembershipRequest
}; 