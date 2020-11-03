const { AuthClientTwoLegged, BucketsApi, ObjectsApi, DerivativesApi } = require('forge-apis');

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, FORGE_BUCKET } = process.env;
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}
const BUCKET = FORGE_BUCKET || `${FORGE_CLIENT_ID.toLowerCase()}-basic-app`;
const PUBLIC_TOKEN_SCOPES = ['viewables:read'];
const INTERNAL_TOKEN_SCOPES = ['bucket:read', 'bucket:create', 'data:read', 'data:write', 'data:create'];

let _tokens = new Map();

async function getAccessToken(scopes) {
    const key = scopes.join(',');
    let token = _tokens.get(key);
    if (!token) {
        const client = new AuthClientTwoLegged(FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, scopes);
        token = await client.authenticate();
        token._expires_at = Date.now() + token.expires_in * 1000;
        _tokens.set(key, token);
        setTimeout(() => _tokens.delete(key), token.expires_in * 1000);
    }
    return {
        access_token: token.access_token,
        token_type: token.token_type,
        expires_in: Math.round((token._expires_at - Date.now()) / 1000)
    };
}

async function getPublicToken() {
    return getAccessToken(PUBLIC_TOKEN_SCOPES);
}

function urnify(objectId) {
    return Buffer.from(objectId).toString('base64').replace(/=/g, '');
}

async function listModels() {
    const token = await getAccessToken(INTERNAL_TOKEN_SCOPES);
    let response = await new ObjectsApi().getObjects(BUCKET, { limit: 64 }, null, token);
    let objects = response.body.items;
    while (response.body.next) {
        const startAt = new URL(response.body.next).searchParams.get('startAt');
        response = await new ObjectsApi().getObjects(BUCKET, { limit: 64, startAt }, null, token);
        objects = objects.concat(response.body.items);
    }
    return objects.map(obj => ({
        id: urnify(obj.objectId),
        name: obj.objectKey
    }));
}

async function ensureBucketExists() {
    const token = await getAccessToken(INTERNAL_TOKEN_SCOPES);
    try {
        await new BucketsApi().getBucketDetails(BUCKET, null, token);
    } catch (err) {
        if (err.statusCode === 404) {
            await new BucketsApi().createBucket({ bucketKey: BUCKET, policyKey: 'temporary' }, {}, null, token);
        } else {
            throw err;
        }
    }
}

async function uploadModel(objectName, buffer, rootFilename) {
    const token = await getAccessToken(INTERNAL_TOKEN_SCOPES);
    const response = await new ObjectsApi().uploadObject(BUCKET, objectName, buffer.byteLength, buffer, {}, null, token);
    const job = {
        input: {
            urn: urnify(response.body.objectId)
        },
        output: {
            formats: [{ type: 'svf', views: ['2d', '3d'] }]
        }
    };
    if (rootFilename) {
        job.input.compressedUrn = true;
        job.input.rootFilename = rootFilename;
    }
    await new DerivativesApi().translate(job, {}, null, token);
}

module.exports = {
    getPublicToken,
    listModels,
    ensureBucketExists,
    uploadModel
};
