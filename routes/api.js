const fs = require('fs');
const express = require('express');
const formidable = require('express-formidable');
const { getPublicToken, listModels, uploadModel } = require('../services/forge.js');

let router = express.Router();

router.use(formidable()); // Process requests with multipart/form-data content type

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

router.post('/api/models', async (req, res) => {
    if (!req.fields['model-name'] || !req.files['model-file']) {
        res.status(400).send('The request is missing one of the required fields ("model-name", "model-file").');
        return;
    }
    try {
        await uploadModel(req.fields['model-name'], fs.readFileSync(req.files['model-file'].path));
        res.status(200).end();
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
