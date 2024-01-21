const router = require('express').Router();

const authControllers = require('../controllers/authControllers');

router.post('/register', authControllers.register);
router.post('/login', authControllers.login);

module.exports = router;
