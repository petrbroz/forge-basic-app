/*
 * Command-line script for running the server application.
 * Usage:
 *   node server.js
 * Environment variables:
 *   VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   FORGE_CLIENT_ID
 *   FORGE_CLIENT_SECRET
 *   FORGE_BUCKET (optional)
 *   PORT (optional)
 */

const express = require('express');
const webpush = require('web-push');
const PORT = process.env.PORT || 3000;

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error('Missing environment variables for push notification.');
    process.exit(1);
}

webpush.setVapidDetails('mailto:petr.broz@autodesk.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

let app = express();
app.use(express.static('public'));
app.use(require('./routes/api.js'));
app.use(require('./routes/push.js'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
