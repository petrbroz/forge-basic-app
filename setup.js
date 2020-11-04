/*
 * Command-line script for one-time provisioning of the application.
 * Usage:
 *   node setup.js
 * Environment variables:
 *   FORGE_CLIENT_ID
 *   FORGE_CLIENT_SECRET
 *   FORGE_BUCKET (optional)
 */

const { ensureBucketExists } = require('./services/forge.js');

async function setup() {
    try {
        await ensureBucketExists();
        console.log('Application provisioned successfully...');
        process.exit(0);
    } catch (err) {
        console.error('Could not provision the application', err);
        process.exit(1);
    }
}

setup();
