const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogger');

// Public — the storefront popup polls this on every page load
router.get('/active', announcementController.getActiveAnnouncement);

// Admin/Staff protected CRUD endpoints
router.get('/', protect, authorize('admin', 'staff'), announcementController.getAllAnnouncements);
router.get('/:id', protect, authorize('admin', 'staff'), announcementController.getAnnouncementById);
router.post('/', protect, authorize('admin', 'staff'), auditLog('admin', 'Created announcement'), announcementController.createAnnouncement);
router.put('/:id', protect, authorize('admin', 'staff'), auditLog('admin', 'Updated announcement'), announcementController.updateAnnouncement);
router.delete('/:id', protect, authorize('admin'), auditLog('admin', 'Deleted announcement'), announcementController.deleteAnnouncement);

module.exports = router;