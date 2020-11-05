const fs = require('fs');
const express = require('express');
const webpush = require('web-push');
const formidable = require('express-formidable');
const { getPublicToken, listModels, uploadModel, translateModel } = require('../services/forge.js');

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

// POST /api/models - uploads new model and starts its conversion for the viewer
router.post('/api/models', formidable(), async (req, res) => {
    if (!req.fields['model-name'] || !req.files['model-file']) {
        res.status(400).send('Some of the required fields ("model-name", "model-file") are missing.');
        return;
    }
    try {
        const objectId = await uploadModel(req.fields['model-name'], fs.readFileSync(req.files['model-file'].path));
        // Kick-off the model translation, and report the result via a push notification
        translateModel(objectId, req.fields['model-zip-entrypoint'])
            .then(status => {
                console.log('Model translation finished with status', status);
                const subscriptions = req.app.get('subs');
                if (subscriptions) {
                    const payload = JSON.stringify({ title: 'test' });
                    for (const subscription of subscriptions) {
                        webpush.sendNotification(subscription, payload)
                            .catch(error => console.error(error.stack));
                    }
                }
            })
            .catch(err => {
                console.error('Model translation failed', err);
            });
        res.status(200).end();
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
