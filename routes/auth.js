const express = require('express');
const passport = require('passport');
const { getPublicToken } = require('../services/forge.js');

let router = express.Router();

// GET /api/auth/profile.js - provides information about logged user, if any
router.get('/profile.js', async (req, res) => {
    try {
        if (req.user) {
            res.type('.js').send(`const USER = { name: '${req.user.displayName}' };`);
        } else {
            res.type('.js').send(`const USER = null;`);
        }
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// GET /api/auth/token - provides an access token to be used by Forge Viewer
router.get('/token', async (req, res) => {
    try {
        res.json(await getPublicToken());
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// GET /api/auth/google/login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
router.get('/google/login', passport.authenticate('google', { scope: ['profile', 'email'] }));

// GET /api/auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
router.get('/google/callback', passport.authenticate('google'), async function (req, res) {
    res.redirect('/');
});

// GET /api/auth/google/logout
router.get('/google/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
