const express = require('express');
const { getPublicToken, listModels } = require('../services/forge.js');

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

// GET /api/models - lists names and URNs of models available in the application's bucket
router.get('/api/models', async (req, res) => {
    try {
        res.json(await listModels());
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
