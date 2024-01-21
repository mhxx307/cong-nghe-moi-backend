require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const initRouter = require("./configs/routerConfig");

app.use(cors());
app.use(express.json());
initRouter(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
