DumbPubSub
===

This module is for Node.js applications in a heterogeneus environment, where
you want your non long-running-process applications (such as a PHP app) to
be able to subscribe to events from your Node.js application.

For example, if a client updates their email address, and you want to alert
your PHP application so that it can perhaps change some memcache entry it
uses, this module is what you are looking for.

External apps can provide an event to bind on to, and a URL to listen on.
When the event occurs, the relevant data is POSTed to said URL.

Long term goals for this project include saving the subscription data to either
a Redis or MongoDB database. The first iteration will only save it to a local
JSON file. There may eventually be so many entries that keeping it in Node memory
wouldn't work, so will have to explore that.

Also, you wouldn't want to use this for inter-nodejs-app communications, for
that you would want to use someone elses library.

Example Requests
===

    POST /subscribe
    P:event
    P:url
    Success: 201 CREATED
    Failure: 409 CONFLICT

    DELETE /subscribe
    (P/G:event)
    (P/G:url)
    Success: 200 OK
    Failure: 404 NOT FOUND

    GET /subscribe
    (G:event)
    (G:url)
    Success: 200 OK

Example Server Code
===

    var dumb = require('dumbpubsub');
    // npm install express
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

Example subscriptions.json
===

    [
        {
            "event": "client-update",
            "url": "http://localhost/listener.php"
        }
    ]

Installation
===

    npm install dumb express
    # copy server.js code from above
    # copy subscriptions.json code from above
    npm server.js

Debugging
===

Here's a tool for Chrome that allows you to make various HTTP requests:

https://chrome.google.com/webstore/detail/hgmloofddffdnphfgcellkdfbfbjeloo

License
===

Dual BSD/GPL
