"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var vectorWatch = new VectorWatch();

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');

    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    logger.info('on subscribe');

    var streamText = getCurrentTime();

    response.setValue(streamText);
    response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});

vectorWatch.on('schedule', function(subscriber) {
    var streamText = getCurrentTime();
    subscriber.pushUpdate(streamText);
});

function zerofy(n) {
    return (n<10)?'0'+n:n;
}

function getCurrentTime() {
    var d = new Date();
    return zerofy(d.getHours()) + ':' + zerofy(d.getMinutes());
}
