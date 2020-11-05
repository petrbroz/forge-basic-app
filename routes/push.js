const express = require('express');

let router = express.Router();

// POST /push/subscribe - subscribes a specific client for push notifications
router.post('/push/subscribe', async (req, res) => {
    const subscription = JSON.parse(req.body);
    const subscriptions = req.app.get('subs');
    subscriptions.push(subscription);
    req.app.set('subs', subscriptions);
    res.status(201).end();
});

module.exports = router;
