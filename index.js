var fs = require('fs');
var util = require('util');
var request = require('request');

var DumbPubSub = function() {
    var self = this;

    // Points to an express server, might work with built-in node server
    self.server = null;

    // The filename of our subscription JSON document
    self.subscriptionFile = '';

    // The name of the event to post to clients
    self.eventPostKey = null;

    // The subscription URL
    self.url = '/subscribe';

    /**
     * Do we want to notify the subscribers of the event?
     * Pass in the key to post as, defaults to event
     */
    self.notifyEvent = function(key) {
        if (typeof key === 'undefined') {
            key = 'event';
        }

        self.eventPostKey = key;

        return this;
    };

    /**
     * Run this function, and we'll keep an eye out for the application
     * ending (e.g. Ctrl+C or a crash). When this happens we'll attempt
     * to write the subscriptions to disk.
     */
    self.persistOnExit = function() {
        process.on('SIGINT', function() {
            console.log("Persisting before quitting...");
            self.persist(function() {
                process.exit();
            });
        });

        return this;
    };

    /**
     * Sets the server attribute to a express HTTP server
     */
    self.attach = function(server) {
        self.server = server;

        return this;
    };

    // An object containing events, each event containing an array of URLs
    self.subscriptions = {
        //'client-update': [
            //'http://localhost/x',
            //'http://localhost/y',
        //],
        //'client-delete': [
            //'http://localhost/x',
        //],
    };

    /**
     * Sets the subscription URL
     * url ~= /subscribe
     */
    self.setUrl = function(url) {
        if (typeof url === 'undefined') {
            url = '/subscribe';
        }
        self.url = url;

        return this;
    };

    /**
     * Tells express about the URLs we want to listen on
     */
    self.enable = function() {
        if (!self.server) {
            console.warn('You need to attach a server before listening.');
            return;
        }
        if (!self.url) {
            console.warn('You need to set a subscription URL first');
            return;
        }

        /**
         * GET /subscribe
         * Returns all subscriptions
         * Example: [ { 'event': 'a', 'url': 'y' }, { 'event': 'b', 'url': 'y' } ] || []
         *
         * GET /subscribe?event=client-delete
         * Returns all subscriptions listening for client-delete
         * Example: [ { 'event': 'X', 'url': 'y' }, { 'event': 'X', 'url': 'y' } ] || []
         *
         * GET /subscribe?event=client-delete&url=http://localhost/listener
         * Returns all subscriptions listening for client-delete on this URL (1 or 0)
         * Example: [ { 'event': 'X', 'url': 'y' } ] || []
         */
        self.server.get(self.url, function(req, res) {
            // Read 'event' and 'url' get params
            var requestedEvent = req.query.event;
            if (!requestedEvent) {
                var parsedData = [];
                forEach(self.subscriptions, function(urls, eventName) {
                    forEach(urls, function(url) {
                        parsedData.push({
                            'event': eventName,
                            'url': url
                        });
                    });
                });
                res.send(parsedData);
                return;
            }

            var url = req.query.url || null;
            var event = self.subscriptions[requestedEvent];

            if (!event) {
                // We got an event from the user, but we don't have any URLs subscribing to it
                res.send([]);
                return;
            } else if (event && !url) {
                // User asked for a real event, and didn't ask for a specific URL
                var parsedData = [];
                forEach(event, function(url) {
                    parsedData.push({
                        'event': requestedEvent,
                        'url': url
                    });
                });
                res.send(parsedData);
                return;
            } else if (event && url) {
                // User is basically checking to see if they registered a specific callback
                var found = false;
                forEach(event, function(x) {
                    if (x === url) {
                        res.send({
                            'event': requestedEvent,
                            'url': url
                        });
                        found = true;
                        return;
                    }
                });
                if (!found) {
                    res.send([]);
                }
            }
        });

        /**
         * Deletes a subscription
         * Returns 404 NOT FOUND if we don't have the url/event stored
         * Returns 200 OK if the delete was a success
         */
        self.server.delete(self.url, function(req, res) {
            // read 'event' and 'url' params. Is there a such things as a delete param? like a post param?
            var eventName = req.query.event || req.body.event || null;
            var url = req.query.url || req.body.url || null;
            if (!eventName) {
                // Delete all the things!
                //if (isEmpty(self.subscriptions)) {
                    //res.send(404);
                //} else {
                    //self.subscriptions = {};
                    //res.send(200);
                //}
                //self.persist();
                res.send(405);
                return;
            } else if (eventName && !url) {
                // Delete all URLs listenting to a specific event
                if (isEmpty(self.subscriptions[eventName])) {
                    res.send(404);
                } else {
                    delete self.subscriptions[eventName];
                    self.persist();
                    res.send(200);
                }
                return;
            } else if (eventName && url) {
                // This person knows exactly what to remove
                var event = self.subscriptions[eventName];
                if (!event) {
                    res.send(404);
                } else if (event) {
                    var urlIndex = event.indexOf(url);
                    if (urlIndex >= 0) {
                        event.splice(urlIndex, 1);
                        res.send(200);
                        if (isEmpty(event)) {
                            // Looks like this is the last URL within that event, might as well kill it
                            delete self.subscriptions[eventName];
                        }
                        self.persist();
                    } else {
                        // Oh man, they tried to delete an event/url combo we just don't have
                        res.send(404);
                    }
                }
                return;
            }
        });

        /**
         * Listens for posts, which means a new subscription is happening
         * Return 409 CONFLICT if we already have it registered
         * Return 201 SUCCESS if we successfully added it
         */
        self.server.post(self.url, function(req, res) {
            // read 'event' and 'url' post params
            var event = req.body.event;
            var url = req.body.url;
            if (self.subscriptions[event] && self.subscriptions[event].indexOf(url) >= 0) {
                // Already have this event/url combo? Giddyup 409
                res.send(409);
                return;
            }

            self.subscribe(event, url);

            res.send(201);
        });

        return this;
    };

    /**
     * This function reads a list of subscriptions from disk and
     * sticks them im memory.
     */
    self.restore = function(dataStore, callback) {
        console.log("Restoring from " + dataStore);
        if (typeof dataStore !== 'string') {
            console.error("Only accepting json filenames for now");
            return false;
        }

        self.subscriptionFile = dataStore;

        fs.readFile(dataStore, function (err, data) {
            if (err) {
                console.error(err);
                return false;
            }
            var subscriptions = JSON.parse(data);

            console.log("Discovered " + subscriptions.length + " subscriptions");

            forEach(subscriptions, function(subscription) {
                self.subscribe(subscription.event, subscription.url, true);
            });

            if (typeof callback === 'function') {
                callback();
            }
        });

        return this;
    };

    /**
     * This function saves the subscriptions to disk from memory.
     */
    self.persist = function(callback) {
        var parsedData = [];
        forEach(self.subscriptions, function(urls, eventName) {
            forEach(urls, function(url) {
                parsedData.push({
                    'event': eventName,
                    'url': url
                });
            });
        });

        var payload = JSON.stringify(parsedData, null, 4);

        fs.writeFile(self.subscriptionFile, payload, function(err) {
            if (err) {
                console.log("Couldn't persist to disk", err);
                return;
            }

            if (typeof callback !== 'undefined') {
                callback();
            }
        });
    };

    /**
     * Adds a new event/url combination to memory
     */
    self.subscribe = function(event, url, restoring) {
        // Adds a subscription to out list of subscriptions
        if (!self.subscriptions[event]) {
            // This is the first time we've encountered this event, better add it to the list
            self.subscriptions[event] = [];
        }
        self.subscriptions[event].push(url);

        if (!restoring) {
            self.persist();
        }
    };

    /**
     * Takes the provided data, and sends it to each URL
     * subscribed to the event.
     */
    self.emit = function(event, data) {
        // Emits an event to our URLs. I was going to use EventEmitter but now I'm not sure...
        var urls = self.subscriptions[event];
        if (!urls || !urls.length) {
            // No URLs to report to
            return;
        }

        // If we want to tell the client the key we add it to the payload
        if (self.eventPostKey) {
            data[self.eventPostKey] = event;
        }

        forEach(urls, function(url) {
            request.post(url, {form: data}, function(error, response, body) {
                if (error && error.code === 'ECONNREFUSED') {
                    // We'll want to retry a few times
                    console.error("Unable to connect to " + url);
                    return;
                }
                console.log("Payload: ", body);
            });
        });
    };

    /**
     * Determins if an array or object is empty
     */
    function isEmpty(obj) {
        // Array
        if (typeof obj.length === 'number' && obj.length === 0) {
            return !obj.length;
        }
        // Object
        return !Object.getOwnPropertyNames(obj).length;
    }

    /**
     * Iterates over each array or object property and runs a callback(value, key)
     */
    function forEach(obj, callback) {
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                callback(obj[key], key);
            }
        }
    }
};

module.exports = new DumbPubSub();
