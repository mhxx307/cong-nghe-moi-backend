const router = require('express').Router();

const authControllers = require('../controllers/authControllers');

router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.post('/forgotPassword', authControllers.forgotPassword);
router.post('/resetPassword', authControllers.resetPassword);

module.exports = router;
