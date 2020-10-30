const express = require('express');
const auth = require('express-basic-auth');
const { ensureBucketExists } = require('./services/forge');

const port = process.env.PORT || 3000;

let app = express();
app.use(express.static('public'));
app.use(auth({
    users: { 'admin': 'supersecret' },
    challenge: true
}));
app.use('/api/models', require('./routes/models'));
app.use('/api/auth', require('./routes/auth'));
ensureBucketExists()
    .then(() => app.listen(port, () => console.log(`Server listening on port ${port}...`)))
    .catch((err) => console.error(err));
