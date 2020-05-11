const fs = require('fs');
const express = require('express');
const formidable = require('formidable');
const { AuthClientTwoLegged, BucketsApi, ObjectsApi, DerivativesApi } = require('forge-apis');

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
const BUCKET = `${FORGE_CLIENT_ID.toLowerCase()}-myfirstapp`;
const SCOPES = ['bucket:read', 'bucket:create', 'data:read', 'data:create', 'data:write'];
const privateAuthClient = new AuthClientTwoLegged(FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, SCOPES, true);
let privateTokenPromise = null;

function urnify(id) {
    return new Buffer(id).toString('base64');
}

async function getPrivateToken() {
    if (!privateTokenPromise) {
        privateTokenPromise = privateAuthClient.authenticate();
        privateTokenPromise.then(function (credentials) {
            setTimeout(function () { privateTokenPromise = null; }, credentials.expires_in * 1000);
        });
    }
    return privateTokenPromise;
}

let bucketsClient = new BucketsApi();
let objectsClient = new ObjectsApi();
let derivativesClient = new DerivativesApi();
let router = express.Router();

async function ensureBucketExists(credentials) {
    const buckets = await bucketsClient.getBuckets({}, privateAuthClient, credentials);
    if (!buckets.body.items.find(bucket => bucket.bucketKey === BUCKET)) {
        const payload = {
            bucketKey: BUCKET,
            policyKey: 'transient'
        };
        await bucketsClient.createBucket(payload, {}, privateAuthClient, credentials);
    }
}

// GET /api/models
// Lists all designs available in an app-specific bucket.
router.get('/', async (req, res) => {
    try {
        const credentials = await getPrivateToken();
        await ensureBucketExists(credentials);
        const objects = await objectsClient.getObjects(BUCKET, {}, privateAuthClient, credentials);
        res.json(objects.body.items.map(function (obj) {
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
            const credentials = await getPrivateToken();
            await ensureBucketExists(credentials);
            const object = await objectsClient.uploadObject(BUCKET, file.name, file.size, buff, {}, privateAuthClient, credentials);
            const payload = {
                input: {
                    urn: urnify(object.body.objectId)
                },
                output: {
                    formats: [{
                        type: 'svf',
                        views: ['2d', '3d']
                    }]
                }
            };
            if (fields['entrypoint-in-zip']) {
                payload.input.compressedUrn = true;
                payload.input.rootFilename = fields['entrypoint-in-zip'];
            }
            await derivativesClient.translate(payload, {}, privateAuthClient, credentials);
            res.status(200).end();
        } catch (err) {
            console.error(err);
            res.status(500).send(err.message);
        }
    });
});

module.exports = router;
