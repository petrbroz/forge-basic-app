const express = require('express');
const { getPublicToken } = require('../services/forge');

let router = express.Router();

// GET /api/auth/token
// Generates a two-legged token to be used by Forge Viewer.
router.get('/token', async function (req, res) {
    try {
        res.json(await getPublicToken());
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
