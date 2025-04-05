import express from 'express';
import { 
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
} from '../controllers/coordinator.controller.js';
import { verifyJWT, isClubCoordinator, isClubOwner } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyJWT, isClubCoordinator);

// Club management
router.get('/clubs', getMyClub);
router.put('/clubs/:clubId', isClubOwner, updateClub);
router.get('/clubs/:clubId/membership-requests', isClubOwner, getMembershipRequests);
router.post('/clubs/membership-response', respondToMembershipRequest);

// Event management
router.post('/events', submitEvent);
router.put('/events/:eventId', updateEvent);
router.get('/clubs/:clubId/events', isClubOwner, getClubEvents);

// Notice management
router.post('/notices', submitNotice);
router.put('/notices/:noticeId', updateNotice);
router.get('/clubs/:clubId/notices', isClubOwner, getClubNotices);

export default router; 