function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login')
}
function setUser(req, res, next) {
    res.locals.currentUser = req.user;
    next();
}
function redirectIfAuthenticated(req, res, next) {
    console.log('redirectIfAuthenticated')
    if (!req.isAuthenticated()) {
        console.log('boring')
        return next();
    }
    return res.redirect('/');
}
function redirectIfMember(req, res, next) {
    if (req.user && req.user.ismember) {
        req.flash('info', 'You are already a member!');
        return res.redirect('/');
    }
    next();
}
function isAdmin(req, res, next) {
    console.log('isAdmin:', req.user.isadmin)
    try {
        if (req.user.isadmin) {
            console.log('isAdmin:', req.user.isadmin)
            return next()
        }
    } catch (err) {
        console.error('Error accesing admin a route:', err);
        res.status(403).send('this route is for admin and ur not admin!')
    }
}
module.exports = {
    isAdmin,
    setUser,
    redirectIfMember,
    isAuthenticated,
    redirectIfAuthenticated
}
