const router = require('express').Router();

const chatControllers = require('../controllers/chatControllers');

router.post('/createChatRoom', chatControllers.createChatRoom);
router.get('/getChatroomById/:chatroomId', chatControllers.getChatroomById);
router.post('/sendMessage', chatControllers.sendMessage);
router.get(
    '/getAllMessagesInRoom/:roomId',
    chatControllers.getAllMessagesInRoom,
);
router.get('/getAllRoomByUserId/:userId', chatControllers.getAllRoomByUserId);
router.post('/inviteToGroupChat', chatControllers.inviteToGroupChat);
router.delete('/deleteMessage/:messageId', chatControllers.deleteMessage);
router.post('/updateChatGroup', chatControllers.updateChatGroup);
router.post('/removeChatroom', chatControllers.removeChatroom);

module.exports = router;
