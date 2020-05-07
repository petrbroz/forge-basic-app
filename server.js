const express = require('express');

const port = process.env.PORT || 3000;
const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, FORGE_BUCKET } = process.env;
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET || !FORGE_BUCKET) {
    console.warn('Missing some of the environment variables.');
    return;
}

let app = express();
app.use(express.static('public'));
app.use('/api/docs', require('./routes/docs'));
app.use('/api/auth', require('./routes/auth'));
app.listen(port, () => console.log(`Server listening on port ${port}...`));
