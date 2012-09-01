var pubsub = require('dumbpubsub');
var express = require('express');

var app = express(); // Create an Express app
pubsub.attach(app); // DumbPubSub will now use the existing Express app

pubsub.notifyEvent(); // By default, we don't tell client what even was run, assuming their URL will let them know

app.get('/', function(req, res) {
    res.send('hello world');
});

pubsub.subscribe('client-update', 'http://localhost/x');
pubsub.subscribe('client-update', 'http://localhost/y');
pubsub.subscribe('client-delete', 'http://localhost/x');

pubsub.listen('/subscribe'); // The DumbPubSub listen method defines the root URL

app.listen(3000);

console.log('listening');

// Emit an event after 10 seconds
setTimeout(function() {
    pubsub.emit('client-update', {
        clientId: 230948230,
        oldEmail: 'tlhunter@gmail.com',
        newEmail: 'tlhunter+github@gmail.com'
    });
}, 10000);
