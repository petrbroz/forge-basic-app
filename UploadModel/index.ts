import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import * as multipart from 'parse-multipart';
import { DataManagementClient, DataRetentionPolicy, ModelDerivativeClient, urnify } from 'forge-server-utils';

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, FORGE_BUCKET } = process.env;
let dataManagementClient = new DataManagementClient({ client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET });
let modelDerivativeClient = new ModelDerivativeClient({ client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET });

interface IMultipartFile {
    filename: string;
    type: string;
    data: Buffer;
}

function parse(req: HttpRequest): IMultipartFile[] {
    const boundary = multipart.getBoundary(req.headers['content-type']);
    // Be careful, the `multipart` module can only parse bodies with files, not with text fields
    const parts = multipart.Parse(Buffer.from(req.body), boundary);
    return parts;
}

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

        // Upload the model
        const files = parse(req);
        if (!files || files.length === 0) {
            throw new Error('No file found.');
        }
        const obj = await dataManagementClient.uploadObject(FORGE_BUCKET, files[0].filename, 'application/octet-stream', files[0].data);
        await modelDerivativeClient.submitJob(urnify(obj.objectId), [{ type: 'svf', views: ['2d', '3d'] }]);
        context.res = { status: 200 };
    } catch (err) {
        context.res = { status: 400, body: err.message || err };
    }
};

export default UploadModel;
