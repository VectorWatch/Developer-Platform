"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var request = require('request');
var VectorWatch = require('vectorwatch-sdk');
var vectorWatch = new VectorWatch();

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');
    
    var from = response.createAutocomplete('From');
    from.setHint('Select from currency');
    from.setDynamic(true);
    from.setAsYouType(1);

    var to = response.createAutocomplete('To');
    to.setHint('Select to currency');
    to.setDynamic(true);
    to.setAsYouType(1);
    
    var format = response.createGridList('Format');
    format.setHint('Select format');
    format.addOption('Value');
    format.addOption('Value & Labels');

    response.send();
});

var currencies = ["BWP", "SGD", "PEN", "TWD", "BRL", "DZD", "MYR", "BYN", "SHP", "BDT", "BOB", "TZS", "BSD", "BND", "IQD", "LVL", "BBD", "CRC", "ALL", "ERN", "MVR", "MDL", "GIP", "AFN", "ITL", "GTQ", "FJD", "RWF", "XCD", "ZAR", "ECS", "NPR", "BYR", "PYG", "MXN", "DOP", "MAD", "GBP", "DJF", "CUC", "BHD", "COP", "YER", "USD", "BZD", "MGA", "BTN", "MKD", "KGS", "LSL", "XDR", "KZT", "KWD", "SOS", "RON", "LBP", "XPD", "SVC", "PKR", "TOP", "XAU", "BMD", "KRW", "KHR", "SDG", "ILS", "CLF", "HNL", "UZS", "ILA", "VND", "SEK", "ETB", "NOK", "IEP", "EGP", "PHP", "AUD", "CZX", "GNF", "JPY", "TJS", "LAK", "RSD", "IDR", "MWK", "CVE", "CNH", "MNT", "INX", "CAD", "CZK", "ANG", "DEM", "QAR", "CUP", "BGN", "AED", "ISX", "AZN", "MRO", "CAX", "JOD", "VUV", "EUR", "NIO", "HRK", "JMD", "XCP", "DKK", "MXV", "UGX", "LTL", "CDF", "WST", "LRD", "CLP", "XPT", "LYD", "NGN", "THB", "PAB", "OMR", "XCU", "HKD", "MMK", "TMT", "SBD", "AMD", "ZMW", "KYD", "SZL", "ZAC", "AWG", "PLN", "CYP", "HUF", "HRX", "XAG", "ARS", "IRR", "TRY", "SAR", "SLL", "XOF", "SYP", "UYU", "SRD", "RUB", "KES", "PLX", "PGK", "FRF", "GYD", "STD", "GMD", "GHS", "LKR", "KPW", "NAD", "MYX", "BIF", "UAH", "MUR", "SCR", "XPF", "VEF", "DKX", "XAF", "NZD", "MZN", "INR", "TND", "ISK", "HUX", "FKP", "CHF", "GEL", "MOP", "SIT", "KMF", "ZWL", "BAM", "AOA", "CNY", "TTD", "BRX", "HTG"];

vectorWatch.on('options', function(event, response) {
    // dynamic options for a specific setting name was requested
    logger.info('on options');
    var settings = event.getUserSettings().settings;
    var searchTerm = event.getSearchTerm();

    switch(event.req.body.settingName) {
        case 'From':
        case 'To':
            for (var i=0;i<currencies.length;i++) {
                if (currencies[i].indexOf(searchTerm.toUpperCase()) === 0) {
                    response.addOption(currencies[i]);
                }
            }
            response.send();
            break;
    }

    return response;
});

function getStreamText(settings, rate) {
    if (settings['Format'].name === 'Value') {
        return rate;
    } else {
        return settings['From'].name  + " = " + rate + " " + settings['To'].name;
    }
}

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    var streamText;
    var settings = event.getUserSettings().settings;
    
    try {
        getRate(settings['From'].name, settings['To'].name).then(function(body) {
            var streamText = getStreamText(settings, body.query.results.rate.Rate);
            response.setValue(streamText);
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

function getRate(from, to) {
    return new Promise(function (resolve, reject) {
        var url = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22"+encodeURIComponent(from)+encodeURIComponent(to)+"%22)&format=json&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=";

        request(url, function (error, httpResponse, body) {
            if (error) {
                reject('REST call error: ' + error.message + ' for ' + url);
                return;
            }

            if (httpResponse && httpResponse.statusCode != 200) {
                reject('REST call error: ' + httpResponse.statusCode + ' for ' + url);
                return;
            }

            try {
                body = JSON.parse(body);
                resolve(body);
            } catch(err) {
                reject('Malformed JSON response from ' + url + ': ' + err.message);
            }

        });
    });
}


vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});


vectorWatch.on('schedule', function(records) {
    logger.info('on schedule');

    records.forEach(function(record) {
        var settings = record.userSettings;
        try {
            getRate(settings['From'].name, settings['To'].name).then(function(body) {
                var streamText = getStreamText(settings, body.query.results.rate.Rate);
                record.pushUpdate(streamText);
            }).catch(function(e) {
                logger.error(e);
            });
        } catch(err) {
            logger.error('on push - malformed user setting: ' + err.message);
        }
    });
});

