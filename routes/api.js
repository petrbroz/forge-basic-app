const express = require('express');
const { getPublicToken } = require('../services/forge.js');

let router = express.Router();

// GET /api/auth/token - provides an access token to be used by Forge Viewer
router.get('/api/auth/token', async (req, res) => {
    try {
        res.json(await getPublicToken());
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
