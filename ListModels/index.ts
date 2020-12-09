import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { DataManagementClient, DataRetentionPolicy, urnify } from 'forge-server-utils';

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, FORGE_BUCKET } = process.env;
let dataManagementClient = new DataManagementClient({ client_id: FORGE_CLIENT_ID, client_secret: FORGE_CLIENT_SECRET });

const ListModels: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
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

        // List objects
        let objects = await dataManagementClient.listObjects(FORGE_BUCKET);
        context.res = {
            body: objects.map(obj => ({
                name: obj.objectKey,
                urn: urnify(obj.objectId)
            }))
        };
    } catch (err) {
        context.res = { status: 400, body: err.message || err };
    }
};

export default ListModels;
