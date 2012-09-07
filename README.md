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

https://github.com/tlhunter/dumbpubsub/blob/master/server.js

Debugging
===

Here's a tool for Chrome that allows you to make various HTTP requests:

https://chrome.google.com/webstore/detail/hgmloofddffdnphfgcellkdfbfbjeloo
