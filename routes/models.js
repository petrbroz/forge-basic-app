const fs = require('fs');
const express = require('express');
const formidable = require('formidable');
const { listModels, uploadAndTranslate } = require('../services/forge');

let router = express.Router();

// GET /api/models
// Lists all designs available in an app-specific bucket.
router.get('/', async (req, res) => {
    try {
        res.json(await listModels());
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// POST /api/models
// Uploads new design to an app-specific bucket.
router.post('/', (req, res, next) => {
    const form = formidable({ multiples: true });
    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        try {
            const { file } = files;
            const buff = fs.readFileSync(file.path);
            await uploadAndTranslate(file.name, file.type, buff, fields['entrypoint-in-zip']);
            res.status(200).end();
        } catch (err) {
            console.error(err);
            res.status(500).send(err.message);
        }
    });
});

module.exports = router;
