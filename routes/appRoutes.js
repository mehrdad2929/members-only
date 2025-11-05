const { Router } = require("express");
const { isAuthenticated, redirectIfAuthenticated, isAdmin, redirectIfMember } = require('../middlewares/auth')
const appController = require('../controllers/appController.js')
const appRouter = Router();

appRouter.get('/', isAuthenticated, appController.getChatroom)
appRouter.post('/messages', isAuthenticated, appController.postMessage);
appRouter.post('/messages/:id/delete', appController.deleteMessage);
appRouter.get('/messages/:id/edit', isAuthenticated, appController.getEditMessage);
appRouter.post('/messages/:id/edit', isAuthenticated, appController.postEditMessage);
appRouter.get('/signup', redirectIfAuthenticated, appController.getSignup)
appRouter.post('/signup', appController.postSignup)
appRouter.get('/login', redirectIfAuthenticated, appController.getLogin)
appRouter.post('/login', appController.postLogin)
appRouter.post('/logout', isAuthenticated, appController.postLogout)

appRouter.post('/users/:id/kick', isAdmin, appController.kickUser);
appRouter.post('/users/:id/promote', isAdmin, appController.postPromoteToMember);
appRouter.post('/users/:id/demote', isAdmin, appController.postDemoteFromMember);
appRouter.get('/becomeMember', isAuthenticated, redirectIfMember, appController.getBecomeMember);
appRouter.post('/becomeMember', isAuthenticated, redirectIfMember, appController.postBecomeMember);
//TODO:about membership gonna be a list of users(admin can member or even kick somone in that /
//memebrs can see users name/authenticated user can see his own username and others are anonymos too him)
//and a user page(with a avatar that u press and go to that page u can activate membership in that page)



//NOTE:and about the admin i think it should not be possible to be admin from the ui
//its like a backend thing(like after deployment i can change stuff in the database(neondb)
//from the local code cause of the connectionString so ill create a querry that makes somone admin
//yea im thinking like a cli app for making somone admin) (it should be hidden from the users)
//so like gonna make a query script or somthing to make a user admin through running script

module.exports = appRouter;
