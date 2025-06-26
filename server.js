require('./config/db');
const UserRouter = require('./api/User');

const app = require('express')();
const port = process.env.PORT || 3000;
const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/api/user', UserRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});