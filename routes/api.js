const express = require('express');
const { getPublicToken, listModels } = require('../services/forge.js');

let router = express.Router();

router.get('/api/auth/token', async (req, res) => {
    try {
        res.json(await getPublicToken());
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

router.get('/api/models', async (req, res) => {
    try {
        res.json(await listModels());
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
