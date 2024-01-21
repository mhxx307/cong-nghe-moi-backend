const userControllers = {
    getAllUsers: (req, res) => {
        res.send("Get all users");
    },
    getUserById: (req, res) => {
        res.send("Get user by id");
    },
};

module.exports = userControllers;
