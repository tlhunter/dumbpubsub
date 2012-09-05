var dumb = require('dumbpubsub');
var express = require('express');

var app = express(); // Create an Express app
dumb.attach(app); // DumbPubSub will now use the existing Express app

dumb.notifyEvent(); // By default, we don't tell client what was run, we assume their URL will let them know

// Normal application requests work as expected
app.get('/', function(req, res) {
    res.send('hello world');
});

// One day we will pass in a redis or mongodb connection, but for now just a filename
dumb.restore('subscriptions.json');

dumb.listen('/subscribe'); // The DumbPubSub listen method defines the root URL

app.listen(3000); // Express (and DumbPubSub) both listen on the same port
console.log('Listening for incomming HTTP requests.');

// Emit an event after 10 seconds
setTimeout(function() {
    dumb.emit('client-update', {
        clientId: 230948230,
        oldEmail: 'tlhunter@gmail.com',
        newEmail: 'tlhunter+github@gmail.com'
    });
}, 10000);
