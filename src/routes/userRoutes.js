const router = require('express').Router();

const userController = require('../controllers/userControllers');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/register', userController.register);
router.post('/login', userController.login);

module.exports = router;
