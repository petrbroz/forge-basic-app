const fs = require('fs');
const express = require('express');
const formidable = require('express-formidable');
const { listModels, uploadModel } = require('../services/forge.js');

let router = express.Router();

// GET /api/models - lists names and URNs of models available in the application's bucket
router.get('/api/models', async (req, res) => {
    try {
        res.json(await listModels());
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// POST /api/models - uploads new model and starts its conversion for the viewer
router.post('/api/models', formidable(), async (req, res) => {
    if (!req.fields['model-name'] || !req.files['model-file']) {
        res.status(400).send('Some of the required fields ("model-name", "model-file") are missing.');
        return;
    }
    try {
        await uploadModel(
            req.fields['model-name'],
            fs.readFileSync(req.files['model-file'].path),
            req.fields['model-zip-entrypoint']);
        res.status(200).end();
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
