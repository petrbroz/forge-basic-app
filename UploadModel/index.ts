import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { DataManagementClient, DataRetentionPolicy } from 'forge-server-utils';

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, FORGE_BUCKET } = process.env;
let dataManagementClient = new DataManagementClient({ client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET });

const UploadModel: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    try {
        // Ensure the bucket exists
        try {
            await dataManagementClient.getBucketDetails(FORGE_BUCKET);
        } catch (err) {
            if (err.statusCode === 404) {
                await dataManagementClient.createBucket(FORGE_BUCKET, DataRetentionPolicy.Temporary);
            } else {
                throw err;
            }
        }

        // Upload object
        //const obj = await dataClient.uploadObject(FORGE_BUCKET, objectName, 'application/octet-stream', buffer);
        //await derivClient.submitJob(urnify(obj.objectId), [{ type: 'svf', views: ['2d', '3d'] }], rootFilename);
        context.res = {
            status: 500, body: { message: 'Not implemented.' }
        };
    } catch (err) {
        context.res = { status: 400, body: err.message || err };
    }
};

export default UploadModel;
