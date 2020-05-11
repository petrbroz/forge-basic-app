const express = require('express');
const { AuthClientTwoLegged } = require('forge-apis');

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
const publicAuthClient = new AuthClientTwoLegged(FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, ['viewables:read'], true);
let publicTokenPromise = null;

async function getPublicToken() {
    if (!publicTokenPromise) {
        publicTokenPromise = publicAuthClient.authenticate();
        publicTokenPromise.then(function (credentials) {
            setTimeout(function () { publicTokenPromise = null; }, credentials.expires_in * 1000);
        });
    }
    return publicTokenPromise;
}

let router = express.Router();

// GET /api/auth/token
// Generates a two-legged token to be used by Forge Viewer.
router.get('/token', async function (req, res) {
    try {
        const token = await getPublicToken();
        res.json(token);
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
