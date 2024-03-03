const router = require('express').Router();

const chatControllers = require('../controllers/chatControllers');

router.post('/createGroup', chatControllers.createGroup);

router.post('/start1v1Chat', chatControllers.start1v1Chat);

router.get('/getAllChatRooms/:userId', chatControllers.getAllChatRooms);

router.get('/getChatMessages', chatControllers.getChatMessages);

router.get('/getAllExistingChats/:userId', chatControllers.getAllExistingChats);

router.put('/updateGroup/:groupId', chatControllers.updateGroup);

router.delete('/deleteGroup/:groupId', chatControllers.deleteGroup);

router.post('/startGroupChat', chatControllers.startGroupChat);

router.get('/getGroupChatMessages/:groupId', chatControllers.getGroupChatMessages);

module.exports = router;
