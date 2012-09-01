var pubsub = require('dumbpubsub');
var express = require('express');

var app = express(); // Create an Express app
pubsub.attach(app); // DumbPubSub will now use the existing Express app

app.get('/', function(req, res) {
    res.send('hello world');
});

pubsub.listen('/subscribe'); // The DumbPubSub listen method defines the root URL

app.listen(3000);

console.log('listening');
