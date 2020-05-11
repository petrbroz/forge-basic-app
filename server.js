const express = require('express');

const port = process.env.PORT || 3000;
const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET } = process.env;
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    return;
}

let app = express();
app.use(express.static('public'));
app.use('/api/models', require('./routes/models'));
app.use('/api/auth', require('./routes/auth'));
app.listen(port, () => console.log(`Server listening on port ${port}...`));
