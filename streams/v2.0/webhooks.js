"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var vectorWatch = new VectorWatch();

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) { 
	
	logger.info('Stream requested configuration');
	
	response.send();
}); 

vectorWatch.on('subscribe', function(event, response) { 
	logger.info('Stream requested subscription');
	
	response.setValue('Waiting...');
	response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
	logger.info('Stream was unsubscribed');
	response.send();
});

vectorWatch.on('webhook', function (event, response) {
    logger.info('Webhook!');
    
    var streamText = event.getQuery()['msg'];
    if (typeof streamText == 'undefined') {
        streamText = 'Unknown';
    }

    vectorWatch.scheduleUpdates({}, {streamText: streamText});

    response.setContentType('text/plain');
    response.statusCode = 200;
    response.setContent('OK');
    response.send();
});

vectorWatch.on('schedule', function(record, args) {
    record.pushUpdate(args.streamText);
});
