import express from 'express';
import { 
    submitEvent,
    getAllPendingEvents,
    approveOrRejectEvent,
    postNotice,
    editNotice,
    removeNotice,
    getAllPendingNotices,
    approveOrRejectNotice,
    createClub,
    getAllUsers,
    changeUserRole
} from '../controllers/admin.controller.js';
import { verifyJWT, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply middleware to all routes
router.use(verifyJWT, isAdmin);

// Event management routes
router.post('/events', submitEvent);
router.get('/events/pending', getAllPendingEvents);
router.post('/events/approval', approveOrRejectEvent);

// Notice management routes
router.post('/notices', postNotice);
router.put('/notices/:noticeId', editNotice);
router.delete('/notices/:noticeId', removeNotice);
router.get('/notices/pending', getAllPendingNotices);
router.post('/notices/approval', approveOrRejectNotice);

// Club management routes
router.post('/clubs/create', createClub);

// User management routes
router.get('/users', getAllUsers);
router.post('/users/role', changeUserRole);

export default router; 