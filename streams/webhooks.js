"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var StorageProvider = require('vectorwatch-storageprovider');

var vectorWatch = new VectorWatch();

var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

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
    pushUpdate(streamText);
    
    response.setContentType('text/plain');
    response.statusCode = 200;
    response.setContent('OK');
    response.send();
});

function pushUpdate(streamText) {
    storageProvider.getAllUserSettingsAsync().then(function(records) {
        records.forEach(function(record) {
            // record.userSettings
            vectorWatch.pushStreamValue(record.channelLabel, streamText);
        });
    });
}
