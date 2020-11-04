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
