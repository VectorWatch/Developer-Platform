// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var request = require('request');

var vectorWatch = new VectorWatch({
    streamUID: process.env.STREAM_UID,
    token: process.env.VECTOR_TOKEN
});

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');

    var country = response.createAutocomplete('Country');
    country.setHint('Select country');
    country.setAsYouType(3); // after 3 characters, throw the "options" event to get matching countries
    country.setDynamic(true); // list options come from the server-side
    response.send();
});

vectorWatch.on('options', function(event, response) {
    // dynamic options for a specific setting name was requested
    logger.info('on options');

    var settingName = event.getSettingName();
    var searchTerm = event.getSearchTerm();

    switch(settingName) {
        case 'Country':
            getCountriesList(response, searchTerm);
            break;
        default:
            logger.error("Invalid setting name: " + settingName);
            response.addOption('ERROR');
            response.send();
    }
});


vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    var streamText;
    try {
        streamText = event.getUserSettings().settings['Country'].name;
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

function getCountriesList(response, searchTerm) {
    
    var url = 'https://restcountries.eu/rest/v1/name/' + encodeURIComponent(searchTerm);
    
    request(url, function (error, response, body) {
        if (response.statusCode != 200) {
            logger.info('Countries REST call error ' + response.statusCode + ' for ' + url + ' : ' + error);
            response.addOption('ERROR');
        }
        
        try {
            var bodyObject = JSON.parse(body);
            for (var i=0;i<bodyObject.length;i++) {
                response.addOption(bodyObject[i]['name']);
            }
        } catch(err) {
            logger.error('Malformed REST service response for ' + url + ': ' + err.message);
            response.addOption('ERROR');
        }

        response.send();
    });
}

vectorWatch.createServer();

