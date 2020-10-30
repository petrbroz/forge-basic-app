const express = require('express');

const port = process.env.PORT || 3000;

let app = express();
app.use(express.static('public'));
app.use('/api/auth', require('./routes/auth'));
app.listen(port, () => console.log(`Server listening on port ${port}...`));