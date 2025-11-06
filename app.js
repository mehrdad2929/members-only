require('@dotenvx/dotenvx').config();
const express = require('express')
const compression = require('compression');
const path = require('path');
const appRouter = require('./routes/appRoutes');
const session = require('express-session');
const pool = require('./db/pool')
const flash = require('connect-flash')
const app = express()
const passport = require('./config/passport');
const { setUser } = require('./middlewares/auth')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

//NOTE:setting up session
app.use(session({
    store: new (require('connect-pg-simple')(session))({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: false, // Disable auto-pruning in serverless
    }),
    secret: process.env.FOO_COOKIE_SECRET,
    name: 'sessionId', // Give it an explicit name
    saveUninitialized: false,
    resave: false,
    rolling: true, // Reset expiry on every response
    cookie: {
        httpOnly: true,
        secure: true, // MUST be true for HTTPS (Vercel uses HTTPS)
        sameSite: 'lax', // Changed from 'strict' - this is key!
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/' // Explicitly set path
    }
}));

app.use(flash());
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
})
//NOTE:starting passport(making it available on all routes)
app.use(passport.initialize());
//NOTE:connecting passport to session(useing session in passport)
app.use(passport.session());
//NOTE:make user available to all views
app.use(setUser);

app.use(compression()); // Compresses res body (gzip, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', appRouter)

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.statusCode || 500).send(err.message);
});
// choose a port
const PORT = 3000;
app.listen(PORT, (error) => {
    if (error) {
        throw error;
    }
    console.log(`my app - listening on port ${PORT}!`);
});
module.exports = app;
