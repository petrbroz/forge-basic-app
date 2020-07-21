const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
const { AuthenticationClient, DataManagementClient, ModelDerivativeClient, DataRetentionPolicy, urnify } = require('forge-server-utils');

if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}

const BUCKET = 'petrbroz-samples'; // `${FORGE_CLIENT_ID.toLowerCase()}-myfirstapp`;
let authClient = new AuthenticationClient(FORGE_CLIENT_ID, FORGE_CLIENT_SECRET);
let dataManagementClient = new DataManagementClient({ client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET });
let modelDerivativeClient = new ModelDerivativeClient({ client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET });

async function ensureBucketExists() {
    const buckets = await dataManagementClient.listBuckets();
    if (!buckets.find(bucket => bucket.bucketKey.toLowerCase() === BUCKET)) {
        await dataManagementClient.createBucket(BUCKET, DataRetentionPolicy.Temporary);
    }
}

async function getPublicToken() {
    return authClient.authenticate(['viewables:read']);
}

async function listModels() {
    const objects = await dataManagementClient.listObjects(BUCKET);
    return objects.map(function (obj) {
        return { id: urnify(obj.objectId), name: obj.objectKey };
    });
}

async function uploadAndTranslate(fileName, fileType, fileBuff, pathInZip) {
    const object = await dataManagementClient.uploadObject(BUCKET, fileName, fileType, fileBuff);
    await modelDerivativeClient.submitJob(urnify(object.objectId), [{ type: 'svf', views: ['2d', '3d'] }], pathInZip);
}

module.exports = {
    getPublicToken,
    ensureBucketExists,
    listModels,
    uploadAndTranslate
};
