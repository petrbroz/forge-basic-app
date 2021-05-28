/*
 * Command-line script for running the server application.
 * Usage:
 *   node server.js
 * Environment variables:
 *   FORGE_CLIENT_ID
 *   FORGE_CLIENT_SECRET
 *   FORGE_BUCKET (optional)
 *   PORT (optional)
 */

const express = require('express');
const PORT = process.env.PORT || 3000;

let app = express();
app.use(express.static('public'));
app.use(require('./routes/api.js'));
app.use(require('./routes/viewer-proxy.js'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
