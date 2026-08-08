const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// All admin routes require admin privileges
router.use(authMiddleware(['SuperAdmin', 'Chief Election Officer', 'Voter Manager', 'Admin']));

router.get('/elections', adminController.getAllElections);
router.post('/elections', authMiddleware(['SuperAdmin', 'Chief Election Officer']), adminController.createElection);
router.post('/elections/:electionId/start', authMiddleware(['SuperAdmin', 'Chief Election Officer']), adminController.startElectionCycle);
router.post('/elections/:electionId/extend', authMiddleware(['SuperAdmin', 'Chief Election Officer']), adminController.extendVotingTime);
router.post('/elections/:electionId/complete', authMiddleware(['SuperAdmin', 'Chief Election Officer']), adminController.completeElection);

router.post('/candidates', authMiddleware(['SuperAdmin', 'Chief Election Officer']), adminController.registerCandidate);
router.get('/elections/:electionId/leaderboard', adminController.getLeaderboardData);
router.get('/voters', adminController.getVerifiedVoters);
router.get('/form-data', adminController.getFormData);
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/create-admin', authMiddleware(['SuperAdmin']), adminController.createAdmin);

module.exports = router;