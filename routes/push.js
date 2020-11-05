const express = require('express');

let router = express.Router();

// POST /push/subscribe - subscribes a specific client for push notifications
router.post('/push/subscribe', express.json(), async (req, res) => {
    const subscription = req.body;
    const subscriptions = req.app.get('subs') || [];
    subscriptions.push(subscription);
    req.app.set('subs', subscriptions);
    res.status(201).end();
});

module.exports = router;
