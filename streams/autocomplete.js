"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var request = require('request');

var vectorWatch = new VectorWatch();

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
            getCountriesList(searchTerm).then(function(countries) {
                for (var i=0;i<countries.length;i++) {
                    response.addOption(countries[i]['name']);
                }
                response.send();
            }).catch(function(e) {
                logger.error(e);
                response.addOption("ERROR");
                response.send();
            });
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
        getCountryCurrency(event.getUserSettings().settings['Country'].name).then(function(currency) {
            response.setValue(currency);
            response.send();
        }).catch(function(e) {
            logger.error(e);
            response.setValue("ERROR");
            response.send();
        });
        
        logger.info('on subscribe: ' + streamText);
    } catch(err) {
        logger.error('on subscribe - malformed user setting: ' + err.message);
        response.setValue("ERROR");
        response.send();
    }

});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});

function getCountriesList(searchTerm) {
    return new Promise(function (resolve, reject) {
        var url = 'https://restcountries.eu/rest/v1/name/' + encodeURIComponent(searchTerm);
        
        request(url, function (error, httpResponse, body) {
            if (httpResponse.statusCode != 200) {
                reject('Countries REST call error ' + httpResponse.statusCode + ' for ' + url + ' : ' + error);
            }

            try {
                var bodyObject = JSON.parse(body);
                resolve(bodyObject);
            } catch(err) {
                reject('Malformed REST service response for ' + url + ': ' + err.message);
            }

        });
    });
}

function getCountryCurrency(country) {
    return new Promise(function (resolve, reject) {
        var url = 'https://restcountries.eu/rest/v1/name/' + encodeURIComponent(country);
      
        request(url, function (error, httpResponse, body) {
            if (httpResponse.statusCode != 200) {
                reject('Countries REST call error ' + httpResponse.statusCode + ' for ' + url + ' : ' + error);
            }
            
            try {
                var bodyObject = JSON.parse(body);
                resolve(bodyObject[0]['currencies'][0]);
            } catch(err) {
                reject('Malformed REST service response for ' + url + ': ' + err.message);
            }
            
        });
    });
}

vectorWatch.createServer();
