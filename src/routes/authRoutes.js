const router = require('express').Router();

const authControllers = require('../controllers/authControllers');

router.post('/register', authControllers.register);
router.post('/login', authControllers.login);
router.router('/forgotPassword').post(authControllers.forgotPassword)
router.router('/resetPassword').post(authControllers.resetPassword)

module.exports = router;
