const router = require('express').Router();

const userController = require('../controllers/userControllers');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUserById);
router.get('/search/s', userController.getUsersByNameAndPhoneNumberAndEmail);
router.put('/change-password/:id', userController.changePassword);
router.post('/sendFriendRequest', userController.sendFriendRequest);
router.post('/acceptFriendRequest', userController.acceptFriendRequest);
router.post('/rejectedFriendRequest', userController.rejectedFriendRequest);
router.get('/getFriendList/:userId', userController.getFriendList);
router.get('/getFriendRequestList/:userId', userController.getFriendRequests);
router.get(
    '/getFriendRequestsReceived/:userId',
    userController.getFriendRequestsReceived,
);
router.post('/unfriend', userController.unfriend);

module.exports = router;
