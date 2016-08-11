"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var StorageProvider = require('vectorwatch-storageprovider');
var Schedule = require('node-schedule');
var VectorWatch = require('vectorwatch-browser');

var vectorWatch = new VectorWatch();

var logger = vectorWatch.logger;

var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

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

function zerofy(n) {
    return (n<10)?'0'+n:n;
}

function getCurrentTime() {
    var d = new Date();
    return zerofy(d.getHours()) + ':' + zerofy(d.getMinutes());
}

function pushUpdates() {
    var streamText = getCurrentTime();
    storageProvider.getAllUserSettingsAsync().then(function(records) {
        records.forEach(function(record) {
            // record.userSettings
            vectorWatch.pushStreamValue(record.channelLabel, streamText);
        });
    });
}

function scheduleJob() {
    var scheduleRule = new Schedule.RecurrenceRule();
    scheduleRule.minute = [15, 45]; // will execute at :15 and :45 every hour
    Schedule.scheduleJob(scheduleRule, pushUpdates);
}

vectorWatch.createServer(scheduleJob);
