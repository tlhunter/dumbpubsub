var dumb = require('dumbpubsub');
var express = require('express');

var app = express(); // Create an Express app
app.use(express.bodyParser());

dumb.attach(app) // DumbPubSub will now use the existing Express app
    .notifyEvent() // By default, we don't tell client what was run, we assume their URL will let them know
    .persistOnExit() // Makes sure we save all subscriptions to disk when we quit
    .restore('subscriptions.json') // Reads this file for subscription info
    .setUrl('/subscribe') // Sets the URL which we listen on
    .enable(); // Tells the express app that we want to listen on some URLs

// Normal application requests work as expected
app.get('/', function(req, res) {
    res.send('hello world');
});

// Allows us to trigger an event using a browser, for testing purposes
app.get('/trigger/:event', function(req, res) {
    dumb.emit(req.route.params.event, {
        from: 'web'
    });
    res.send(200);
});

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
