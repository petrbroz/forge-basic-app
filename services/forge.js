const { AuthClientTwoLegged, BucketsApi, ObjectsApi, DerivativesApi } = require('forge-apis');

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, FORGE_BUCKET } = process.env;
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET || !FORGE_BUCKET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}
const PUBLIC_TOKEN_SCOPES = ['viewables:read'];
const INTERNAL_TOKEN_SCOPES = ['bucket:read', 'bucket:create', 'data:read', 'data:write', 'data:create'];

const urnify = (objectId) => Buffer.from(objectId).toString('base64').replace(/=/g, '');

let _tokens = new Map();

/**
 * Generates access token for given set of scopes.
 * @async
 * @param {string[]} scopes List of scopes (https://forge.autodesk.com/en/docs/oauth/v2/developers_guide/scopes).
 * @returns {Promise} Credentials object with properties such as `access_token`, `token_type`, and `expires_in`.
 */
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

/**
 * Generates access token with limited capabilities that can be shared with the client side code.
 * @async
 * @returns {Promise} Credentials object with properties such as `access_token`, `token_type`, and `expires_in`.
 */
async function getPublicToken() {
    return getAccessToken(PUBLIC_TOKEN_SCOPES);
}

/**
 * Lists all objects available in pre-configured bucket in the Data Management service for a specific user ID.
 * @async
 * @param {string} userId User ID to filter available objects.
 * @returns {Promise} List of objects, each with properties `name` and `urn` (base64-encoded object ID).
 */
async function listModels(userId) {
    const prefix = userId + '/';
    const token = await getAccessToken(INTERNAL_TOKEN_SCOPES);
    let response = await new ObjectsApi().getObjects(FORGE_BUCKET, { limit: 64, beginsWith: prefix }, null, token);
    let objects = response.body.items;
    while (response.body.next) {
        const startAt = new URL(response.body.next).searchParams.get('startAt');
        response = await new ObjectsApi().getObjects(FORGE_BUCKET, { limit: 64, startAt }, null, token);
        objects = objects.concat(response.body.items);
    }
    return objects.map(obj => ({
        name: obj.objectKey.replace(prefix, ''),
        urn: urnify(obj.objectId)
    }));
}

/**
 * Uploads a model for a specific user and starts its conversion for the viewer.
 * @async
 * @param {string} userId User ID.
 * @param {string} objectName How the model should be named in the Data Management service.
 * @param {Buffer} buffer Content of the uploaded file.
 * @param {string} [rootFilename] Optional name of the main design file when uploading a ZIP archive.
 */
async function uploadModel(userId, objectName, buffer, rootFilename) {
    const token = await getAccessToken(INTERNAL_TOKEN_SCOPES);
    const response = await new ObjectsApi().uploadObject(FORGE_BUCKET, userId + '/' + objectName, buffer.byteLength, buffer, {}, null, token);
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
    uploadModel
};
