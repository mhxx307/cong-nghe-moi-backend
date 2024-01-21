const userRouters = require("../routes/userRoutes");

const initRouter = (app) => {
    app.use("/users", userRouters);
};

module.exports = initRouter;
