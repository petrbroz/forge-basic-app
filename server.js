/*
 * Command-line script for running the server application.
 * Usage:
 *   node server.js
 * Environment variables:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT
 *   FORGE_CLIENT_ID
 *   FORGE_CLIENT_SECRET
 *   FORGE_BUCKET (optional)
 *   PORT (optional)
 */

const express = require('express');
const webpush = require('web-push');
const PORT = process.env.PORT || 3000;

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.error('Missing environment variables for push notifications.');
    process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

let app = express();
app.use(function (req, res, next) {
    res.cookie('VAPID_PUBLIC_KEY', VAPID_PUBLIC_KEY);
    next();
});
app.use(express.static('public'));
app.use(require('./routes/api.js'));
app.use(require('./routes/push.js'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
