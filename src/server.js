require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const initRouter = require('./configs/routerConfig');
const connectDatabase = require('./configs/connectDatabase');

app.use(cors());
app.use(express.json());
initRouter(app);
connectDatabase();

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
