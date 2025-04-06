import express from 'express';
import { 
    getAllEvents, 
    getAllNotices, 
    getAllClubs,
    registerForEvent,
    saveNotice,
    bookmarkEvent,
    requestClubMembership,
    getUserClubMemberships,
    getUserEvents,
    getUserSavedNotices,
    getUserBookmarks
} from '../controllers/commonController.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/events', getAllEvents);
router.get('/notices', getAllNotices);
router.get('/clubs', getAllClubs);

// Protected routes (require authentication)
router.post('/events/:eventId/register', verifyJWT, registerForEvent);
router.post('/notices/:noticeId/save', verifyJWT, saveNotice);
router.post('/events/:eventId/bookmark', verifyJWT, bookmarkEvent);

// Club membership
router.post('/clubs/:clubId/request-membership', verifyJWT, requestClubMembership);

// User profile routes
router.get('/user/clubs', verifyJWT, getUserClubMemberships);
router.get('/user/events', verifyJWT, getUserEvents);
router.get('/user/notices', verifyJWT, getUserSavedNotices);
router.get('/user/bookmarks', verifyJWT, getUserBookmarks);

export default router; 