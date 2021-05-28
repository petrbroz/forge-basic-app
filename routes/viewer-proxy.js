const express = require('express');
const fetch = require('node-fetch');
const { getPublicToken } = require('../services/forge.js');

let router = express.Router();

const FORGE_HOST = 'https://developer.api.autodesk.com';

router.use('/viewer-proxy', async (req, res) => {
    try {
        // Here you could apply your own authorization, for example, making sure
        // that owner of the incoming token can only access specific URNs.
        const headers = {
            'Authorization': 'Bearer ' + (await getPublicToken()).access_token
        };
        fetch(FORGE_HOST + req.path, { headers })
            .then(resp => resp.buffer())
            .then(buff => res.send(buff))
            .catch(err => res.status(400).send(err));
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
