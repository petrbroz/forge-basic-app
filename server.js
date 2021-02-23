/*
 * Command-line script for running the server application.
 * Usage:
 *   node server.js
 * Environment variables:
 *   FORGE_CLIENT_ID
 *   FORGE_CLIENT_SECRET
 *   FORGE_BUCKET
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_CALLBACK_URL
 *   PORT (optional)
 */

const express = require('express');
const passport = require('passport');
const session = require('cookie-session');
const { OAuth2Strategy } = require('passport-google-oauth');
const { GoogleAuthOptions, verifyUser, serializeUser, deserializeUser } = require('./services/google');

const PORT = process.env.PORT || 3000;

let app = express();
app.use(express.static('public'));

// Setup Google auth using Passport.js
app.use(session({ maxAge: 24 * 60 * 60 * 1000, keys: ['5ession5ecret!'] }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new OAuth2Strategy(GoogleAuthOptions, verifyUser));
passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/models', require('./routes/models.js'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
