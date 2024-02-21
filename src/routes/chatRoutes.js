const router = require('express').Router();

const chatControllers = require('../controllers/chatControllers');

router.get('/createGroup', chatControllers.createGroup);

router.get('/start1v1Chat', chatControllers.start1v1Chat);

module.exports = router;
