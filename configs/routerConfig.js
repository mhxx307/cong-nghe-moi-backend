const userRouters = require('../routes/userRoutes');
const authRouters = require('../routes/authRoutes');
const chatRouters = require('../routes/chatRoutes');
const notificationRouters = require('../routes/notificationRoutes');

const initRouter = (app) => {
    app.use('/api/v1/users', userRouters);
    app.use('/api/v1/auth', authRouters);
    app.use('/api/v1/chat', chatRouters);
    app.use('/api/v1/notification', notificationRouters);
};

module.exports = initRouter;
