const fs = require('fs');
const express = require('express');
const formidable = require('formidable');
const { DataManagementClient, ModelDerivativeClient, DataRetentionPolicy, urnify } = require('forge-server-utils');

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
const BUCKET = `${FORGE_CLIENT_ID}-myfirstapp`.toLowerCase();

let auth = { client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET };
let dataManagementClient = new DataManagementClient(auth);
let modelDerivativeClient = new ModelDerivativeClient(auth);
let router = express.Router();

async function ensureBucketExists() {
    const buckets = await dataManagementClient.listBuckets();
    if (!buckets.find(bucket => bucket.bucketKey.toLowerCase() === BUCKET)) {
        await dataManagementClient.createBucket(BUCKET, DataRetentionPolicy.Temporary);
    }
}

// GET /api/models
// Lists all designs available in an app-specific bucket.
router.get('/', async (req, res) => {
    try {
        await ensureBucketExists();
        const objects = await dataManagementClient.listObjects(BUCKET);
        res.json(objects.map(function (obj) {
            return { id: urnify(obj.objectId), name: obj.objectKey };
        }));
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
            await ensureBucketExists();
            const object = await dataManagementClient.uploadObject(BUCKET, file.name, file.type, buff);
            await modelDerivativeClient.submitJob(urnify(object.objectId), [{ type: 'svf', views: ['2d', '3d'] }], fields['entrypoint-in-zip']);
            res.status(200).end();
        } catch (err) {
            console.error(err);
            res.status(500).send(err.message);
        }
    });
});

module.exports = router;
