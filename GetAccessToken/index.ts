import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { AuthenticationClient } from 'forge-server-utils';

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
let authClient = new AuthenticationClient(FORGE_CLIENT_ID, FORGE_CLIENT_SECRET);

const GetAccessToken: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    try {
        const credentials = await authClient.authenticate(['viewables:read']);
        context.res = { body: credentials };
    } catch (err) {
        context.res = { status: 400, body: err.message || err };
    }
};

export default GetAccessToken;
