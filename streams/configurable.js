"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');

var vectorWatch = new VectorWatch({
    streamUID: process.env.STREAM_UID,
    token: process.env.VECTOR_TOKEN
});

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');

    var what = response.createGridList('What');
    what.setHint('What would you like to say?');
    what.addOption('Hello');
    what.addOption('Bonjour');
    what.addOption('Hola');

    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    var streamText;
    try {
        streamText = event.getUserSettings().settings['What'].name;
        logger.info('on subscribe: ' + streamText);
    } catch(err) {
        logger.error('on subscribe - malformed user setting: ' + err.message);
        streamText = 'ERROR';
    }

    response.setValue(streamText);

    response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
});

vectorWatch.createServer();
