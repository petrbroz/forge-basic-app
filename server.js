const express = require('express');
const { ensureBucketExists } = require('./services/forge');

const port = process.env.PORT || 3000;

let app = express();
app.use(express.static('public'));
app.use('/api/models', require('./routes/models'));
app.use('/api/auth', require('./routes/auth'));
ensureBucketExists()
    .then(() => app.listen(port, () => console.log(`Server listening on port ${port}...`)))
    .catch((err) => console.error(err));
