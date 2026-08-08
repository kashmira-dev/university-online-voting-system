const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');

// All student routes require 'student_voter' role
router.use(authMiddleware(['student_voter']));

router.get('/elections', studentController.getStudentElections);
router.get('/elections/:electionId/ballot', studentController.getBallotDetails);
router.post('/vote', studentController.castVote);
router.get('/turnout/:departmentId', studentController.getDepartmentTurnout);
router.get('/elections/:electionId/results', studentController.getElectionResults);
module.exports = router;