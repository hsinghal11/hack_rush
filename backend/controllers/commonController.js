import EventModel from "../models/event.model.js";
import NoticeModel from "../models/notice.model.js";
import ClubModel from "../models/club.model.js";
import UserModel from "../models/user.model.js";

const pushEvent = async (req, res) => {
    try {
        const { name, description, date, time, location, club } = req.body;
        
    const event = await EventModel.create({ name, description, date, time, location, club });
    res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const getAllNotices = async (req, res) => {
    try {
        const notices = await NoticeModel.find({ status: 'approved' })
            .populate('club', 'name')
            .sort({ createdAt: -1 });
            
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
}

const getAllEvents = async (req, res) => {
    try {
        const events = await EventModel.find({ status: 'approved' })
            .populate('club', 'name description')
            .sort({ date: 1 });
            
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
}   

const getAllClubs = async (req, res) => {
    try {
        const clubs = await ClubModel.find()
            .populate('coordinator', 'name email')
            .select('-members -events -notices -membershipRequests');
            
        res.status(200).json({
            success: true,
            count: clubs.length,
            clubs
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
}

// Student registration for events
const registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user._id;

        // Check if event exists and is approved
        const event = await EventModel.findOne({ _id: eventId, status: 'approved' });
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: "Event not found or not approved yet" 
            });
        }

        // Check if user is already registered
        if (event.participants.includes(userId)) {
            return res.status(400).json({ 
                success: false,
                message: "You are already registered for this event" 
            });
        }

        // Add user to event participants
        event.participants.push(userId);
        await event.save();

        // Add event to user's registered events
        await UserModel.findByIdAndUpdate(
            userId,
            { $addToSet: { registeredEvents: eventId } }
        );

        res.status(200).json({
            success: true,
            message: "Successfully registered for the event"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Save notice (bookmark)
const saveNotice = async (req, res) => {
    try {
        const { noticeId } = req.params;
        const userId = req.user._id;

        // Check if notice exists and is approved
        const notice = await NoticeModel.findOne({ _id: noticeId, status: 'approved' });
        if (!notice) {
            return res.status(404).json({ 
                success: false,
                message: "Notice not found or not approved yet" 
            });
        }

        // Add notice to user's saved notices
        await UserModel.findByIdAndUpdate(
            userId,
            { $addToSet: { savedNotices: noticeId } }
        );

        res.status(200).json({
            success: true,
            message: "Notice saved successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Bookmark an event
const bookmarkEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user._id;

        // Check if event exists and is approved
        const event = await EventModel.findOne({ _id: eventId, status: 'approved' });
        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: "Event not found or not approved yet" 
            });
        }

        // Add event to user's bookmarks
        await UserModel.findByIdAndUpdate(
            userId,
            { $addToSet: { "bookmarks.events": eventId } }
        );

        res.status(200).json({
            success: true,
            message: "Event bookmarked successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Request club membership
const requestClubMembership = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.user._id;

        // Check if club exists
        const club = await ClubModel.findById(clubId);
        if (!club) {
            return res.status(404).json({ 
                success: false,
                message: "Club not found" 
            });
        }

        // Check if user is already a member
        if (club.members.includes(userId)) {
            return res.status(400).json({ 
                success: false,
                message: "You are already a member of this club" 
            });
        }

        // Check if there is already a pending request
        const existingRequest = club.membershipRequests.find(
            request => request.user.toString() === userId.toString() && request.status === 'pending'
        );

        if (existingRequest) {
            return res.status(400).json({ 
                success: false,
                message: "You already have a pending membership request for this club" 
            });
        }

        // Add membership request
        club.membershipRequests.push({
            user: userId,
            status: 'pending',
            requestDate: new Date()
        });

        await club.save();

        res.status(200).json({
            success: true,
            message: "Club membership request sent successfully"
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get user's club memberships
const getUserClubMemberships = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await UserModel.findById(userId).populate('clubMemberships', 'name description');

        res.status(200).json({
            success: true,
            clubMemberships: user.clubMemberships
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get user's registered events
const getUserEvents = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await UserModel.findById(userId).populate({
            path: 'registeredEvents',
            match: { status: 'approved' },
            populate: {
                path: 'club',
                select: 'name'
            }
        });

        res.status(200).json({
            success: true,
            registeredEvents: user.registeredEvents
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// Get user's saved notices
const getUserSavedNotices = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await UserModel.findById(userId).populate({
            path: 'savedNotices',
            match: { status: 'approved' },
            populate: {
                path: 'club',
                select: 'name'
            }
        });

        res.status(200).json({
            success: true,
            savedNotices: user.savedNotices
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

export { pushEvent, getAllNotices, getAllEvents, getAllClubs, registerForEvent, saveNotice, bookmarkEvent, requestClubMembership, getUserClubMemberships, getUserEvents, getUserSavedNotices };
