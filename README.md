DumbPubSub
===

This module is for Node.js applications in a heterogeneus environment, where
you want your non long-running-process applications (such as a PHP app) to
be able to subscribe to events from your Node.js application.

For example, if a client updates their email address, and you want to alert
your PHP application so that it can perhaps change some memcache entry it
uses, this module will work for you.

External apps can provide an event to bind on to, and a URL to listen on.
When the event occurs, the relevant data is POSTed to said URL.

The module will use EventEmitter, and hopefully be able to store subscription
informaiton in either Redis or MongoDB or JSON on disk.

Example Requests
===

    POST /subscribe
    event_name
    callback_url
    Success: 201 CREATED
    Failure: 409 CONFLICT

    DELETE /subscribe
    event_name
    callback_url
    Success: 200 OK
    Failure: 404 NOT FOUND

    GET /subscribe
    (event_name)
    (callback_url)
    Success: 200 OK

Example Server Code
===

    pubsub = require('dumbpubsub');

    pubsub.restoreSubscription(dataStore); // Load existing subscriptions from disk

    pubsub.attach(expressApp); // Attach to an existing express/http instance

    pubsub.listen(); // Listen for new requests

    // POSTs this data to clients who have subscribed to the client-info-update event
    pubsub.emit('client-info-update', {
        clientId: 230948230,
        oldEmail: 'tlhunter@gmail.com',
        newEmail: 'tlhunter+github@gmail.com'
    });

