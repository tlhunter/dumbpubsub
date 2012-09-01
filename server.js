var pubsub = require('dumbpubsub');
var express = require('express');

var app = express();
pubsub.attach(app);

app.get('/', function(req, res) {
    res.send('hello world');
});

pubsub.listen('/subscribe');

app.listen(3000);

console.log('listening');
