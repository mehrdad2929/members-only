const express = require('express')
const compression = require('compression');
const path = require('path');
const messageRouter = require('./routes/messagesRouter');

const app = express()
app.use(compression()); // Compresses res body (gzip, etc.)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
// for using static files on vercel(in this case styles)
app.use(express.static(path.join(__dirname, 'public')));
// u add router here
app.use('/', messageRouter)

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).send(err.message);
});
// choose a port
const PORT = 3001;
app.listen(PORT, (error) => {
    if (error) {
        throw error;
    }
    console.log(`my app - listening on port ${PORT}!`);
});
module.exports = app;
