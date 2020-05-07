const express = require('express');
const { AuthenticationClient } = require('forge-server-utils');

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;

let authClient = new AuthenticationClient(FORGE_CLIENT_ID, FORGE_CLIENT_SECRET);
let router = express.Router();

// GET /api/auth/token
// Generates a two-legged token to be used by Forge Viewer.
router.get('/token', async function (req, res) {
    try {
        const token = await authClient.authenticate(['viewables:read']);
        res.json(token);
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
