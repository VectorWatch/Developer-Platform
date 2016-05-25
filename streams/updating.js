// trigger the debugger so that you can easily set breakpoints
debugger;

var StorageProvider = require('vectorwatch-storageprovider');
var Schedule = require('node-schedule');
var VectorWatch = require('vectorwatch-browser');

var vectorWatch = new VectorWatch({
    streamUID: process.env.STREAM_UID,
    token: process.env.VECTOR_TOKEN
});

var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    console.log('on config');

    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    console.log('on subscribe');

    var streamText = getCurrentTime();

    response.setValue(streamText);
    response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    console.log('on unsubscribe');
});

function getCurrentTime() {
    var d = new Date();
    return d.getHours() + ':' + d.getMinutes();
}

function pushUpdates() {
    var streamText = getCurrentTime();
    storageProvider.getAllUserSettingsAsync().then(function(records) {
        for (var i=0; i<records.length; i++) {
            vectorWatch.pushStreamValue(records[i].channelLabel, streamText);
        }
    });
}

function scheduleJob() {
    var scheduleRule = new Schedule.RecurrenceRule();
    scheduleRule.minute = [15, 45]; // will execute at :15 and :45 every hour
    Schedule.scheduleJob(scheduleRule, pushUpdates);
}

vectorWatch.createServer(scheduleJob);
