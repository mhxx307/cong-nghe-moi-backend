const router = require('express').Router();

const userController = require('../controllers/userControllers');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUserById);
router.get('/search/s', userController.getUsersByNameAndPhoneNumberAndEmail);
router.put('/change-password/:id', userController.changePassword);

module.exports = router;
