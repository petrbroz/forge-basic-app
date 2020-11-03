const { ensureBucketExists } = require('./services/forge.js');

ensureBucketExists()
    .then(() => {
        console.log('Application provisioned successfully...');
        process.exit(0);
    })
    .catch(err => {
        console.error('Could not provision the application', err);
        process.exit(1);
    });
