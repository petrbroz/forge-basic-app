const { AuthClientTwoLegged } = require('forge-apis');

const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}
const PUBLIC_TOKEN_SCOPES = ['viewables:read'];

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

module.exports = {
    getPublicToken,
};
