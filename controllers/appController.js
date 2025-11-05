const passport = require('passport');
const bcrypt = require('bcryptjs');
const db = require('../db/queries');
// exports.editMessage = async (req, res) => {
//     const message = await getMessageById(req.params.id);
//
//     // Check: Is this user the author?
//     if (message.user_id !== req.user.id) {
//         return res.status(403).send("Not authorized");
//     }
//
//     // Proceed with edit...
// }
exports.getChatroom = async (req, res) => {
    const messages = await db.getMessageWithAuthor();

    // Get user's last message ID
    let lastMessageId = null;
    if (req.user) {
        const lastMsg = await db.getLastMessageByUser(req.user.id);
        lastMessageId = lastMsg?.id;
        console.log('LastMessage:', lastMsg)
    }

    // Add permission flags to each message
    const messagesWithPerms = messages.map(msg => {
        console.log('messageid:', msg.id)
        const isAuthor = req.user && msg.user_id === req.user.id;
        console.log('isAuthor:', isAuthor)
        const isAdmin = req.user && req.user.isadmin;
        const isLastMessage = msg.id === lastMessageId;
        console.log('isLastMessage:', isLastMessage)

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const withinTimeLimit = new Date(msg.created_at) > twoHoursAgo;

        return {
            ...msg,
            canEdit: (isAuthor && isLastMessage && withinTimeLimit),
            canDelete: isAdmin || isAuthor
        };
    });

    res.render('index', {
        messages: messagesWithPerms,
        user: req.user,
        allUsers: await db.getAllUsersWithStats()
    });
}
exports.getUsersPage = async (req, res) => {
    const users = await db.getAllUsersWithStats();
    console.log(users)
    console.log('current user:', req.user)
    res.render('users', {
        title: 'users list',
        currentUser: req.user,
        users: await db.getAllUsersWithStats()
    })
}
exports.postMessage = async (req, res) => {
    const message = req.body.message;
    await db.insertMessage(message, req.user.id);
    res.redirect('/')
}
exports.deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const message = await db.getMessageWithId(messageId);
        if (!message) {
            return res.status(404).send('Message not found');
        }
        if (!req.user.isadmin && !(req.user.id === message.user_id)) {
            return res.status(403).send('You are not authorized to delete this message');
        }
        await db.deleteMessage(messageId);
        res.redirect('/')
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).send('Something went wrong')
    }
}
exports.getEditMessage = async (req, res) => {
    console.log('edditing this message', await db.getMessageWithId(req.params.id))
    res.render('editMessage', {
        message: await db.getMessageWithId(req.params.id)
    });
}
exports.postEditMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const message = await db.getMessageWithId(messageId);
        if (!message) {
            return res.status(404).send('Message not found');
        }
        if (!(req.user.id === message.user_id)) {
            return res.status(403).send('You are not authorized to edit this message');
        }

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const messageCreatedAt = new Date(message.created_at);
        console.log(messageCreatedAt);
        console.log(twoHoursAgo);
        if (twoHoursAgo > messageCreatedAt) {
            return res.status(403).send('You are not allowed to change message after 2 hours.');
        }
        const lastMessage = await db.getLastMessageByUser(req.user.id)
        if (!lastMessage.id === messageId) {
            return res.status(403).send('You can only edit ur last message.');
        }
        const editedMessage = req.body.message;
        await db.updateMessageWithId(messageId, editedMessage);
        res.redirect('/')
    } catch (err) {
        console.error('Error editing message:', err);
        res.status(500).send('Something went wrong')
    }
}
exports.getLogin = async (req, res) => {
    res.render('login', { title: 'login page' })
}
exports.postLogin = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: 'login',
    failureFlash: true
});
exports.postLogout = async (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    })
}
exports.getSignup = async (req, res) => {
    res.render('signup', { title: 'signup page' })
}
exports.postSignup = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const existingUsername = await db.getUserWithUsername(username);
        if (existingUsername) {
            req.flash('error', 'Username already taken');
            res.redirect('/signup');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await db.insertUserWithUsername(username, hashedPassword);
        req.login(user, (err) => {
            if (err) return next(err);
            req.flash('success', 'Account created!');
            res.redirect('/');  // Go straight to home, logged in!
        });
    } catch (err) {
        return next(err);
    }
}
//we can do this stugg with ajax on front end with 
exports.postPromoteToMember = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!req.user.isadmin) {
            return res.status(403).send('You are not authorized to promote a user');
        }
        await db.promoteToMember(userId);
        res.redirect('/#open-users-modal')
    } catch (err) {
        console.error('Error promoting user:', err);
        res.status(500).send('Something went wrong')
    }
}
exports.postDemoteFromMember = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!req.user.isadmin) {
            return res.status(403).send('You are not authorized to demote a user');
        }
        await db.demoteFromMember(userId);
        res.redirect('/#open-users-modal')
    } catch (err) {
        console.error('Error demoting user:', err);
        res.status(500).send('Something went wrong')
    }
}
exports.kickUser = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Safety check: Can't kick yourself!
        if (userId === req.user.id) {
            return res.status(400).send("You can't kick yourself!");
        }

        // Can't kick other admins
        const targetUser = await db.getUserWithId(userId);
        if (targetUser.isadmin) {
            return res.status(403).send("Can't kick other admins!");
        }

        // Delete user and their sessions
        await db.deleteUser(userId);
        await db.deleteUserSessions(userId);

        res.redirect('/#open-users-modal');
    } catch (err) {
        console.error('Error kicking user:', err);
        res.status(500).send('Something went wrong');
    }
}
exports.getBecomeMember = (req, res) => {
    res.render('becomeMember', {
        title: 'Become a Member',
        puzzle: 'What comes first, the chicken or the...?'
    });
}

exports.postBecomeMember = async (req, res) => {
    try {
        const { answer } = req.body;

        // Normalize answer (lowercase, trim spaces)
        const normalizedAnswer = answer.toLowerCase().trim();
        const correctAnswer = process.env.MEMBERSHIP_SECRET.toLowerCase();

        if (normalizedAnswer === correctAnswer) {
            // Correct!
            await db.promoteToMember(req.user.id);
            req.flash('success', '🎉 Congratulations! You are now a member!');
            res.redirect('/');
        } else {
            // Wrong
            req.flash('error', '❌ Incorrect answer. Think again!');
            res.redirect('/becomeMember');
        }
    } catch (err) {
        console.error('Error in becomeMember:', err);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/becomeMember');
    }
}
// exports.postBecomeMember = async (req, res) => {
//
//     try {
//         const messageUserId = req.body.user_id;
//         const message = await db.getMessageWithId(messageId);
//         if (!message) {
//             return res.status(404).send('Message not found');
//         }
//         if (!req.user.isadmin && !(req.user.id === message.user_id)) {
//             return res.status(403).send('You are not authorized to delete this message');
//         }
//         await db.deleteMessage(messageId);
//         res.redirect('/')
//     } catch (err) {
//         console.error('Error deleting message:', err);
//         res.status(500).send('Something went wrong')
//     }
//     const user = await db.becomeMember(req.user.id)
//     // req.flash('success', 'You are a member now!')
//     res.redirect('/');
// }
// exports.postDemoteMember = async (req, res) => {
//     await db.demoteMember(req.body.userId);
//     res.redirect('/');
// }
// TODO: gonna handle membership after message 
// with one list of users page only avilable to admin(which can disable or enable them)
// and a membership page for current user which he can enable or disable his membership in it
