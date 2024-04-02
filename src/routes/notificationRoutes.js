const notificationRoutes = require('express').Router();

const notificationControllers = require('../controllers/notificationControllers');

notificationRoutes.get(
    '/getNotifications/:userId',
    notificationControllers.getNotifications,
);

module.exports = notificationRoutes;
