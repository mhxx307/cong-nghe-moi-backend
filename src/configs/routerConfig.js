const userRouters = require('../routes/userRoutes');
const authRouters = require('../routes/authRoutes');

const initRouter = (app) => {
    app.use('/api/v1/users', userRouters);
    app.use('/api/v1/auth', authRouters);
};

module.exports = initRouter;
