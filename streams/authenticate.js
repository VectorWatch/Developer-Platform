"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var OAuth2Provider = require('vectorwatch-authprovider-oauth2');
var StorageProvider = require('vectorwatch-storageprovider');
var request = require('request');

var vectorWatch = new VectorWatch();

var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

var authProvider = new OAuth2Provider (storageProvider, {
    clientId: '***', // your App Id
    clientSecret: '***', // your App Secret

    accessTokenUrl: 'https://graph.facebook.com/oauth/access_token',
    authorizeUrl: 'https://www.facebook.com/dialog/oauth?response_type=code&scope=public_profile',
    callbackUrl: 'https://developer.vectorwatch.com/platform/authCallback/'+process.env.STREAM_UUID+'/' + process.env.VERSION
});

vectorWatch.setAuthProvider(authProvider);

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');

    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    logger.info('on subscribe');

    event.getAuthTokensAsync().then(function(authTokens) {
        if (!authTokens) {
            response.sendInvalidAuthTokens();
        }

        var options = {
            url: 'https://graph.facebook.com/v2.6/me/?fields=id%2Cname',
            headers: {
                'Authorization': 'OAuth ' + authTokens.access_token
            }
        };

        request(options, function(error, httpResponse, body) {
            if (error) {
                logger.error('REST call error: ' + error.message + ' for ' + options.url);
                response.setValue("ERROR");
                response.send();
                return;
            }

            if (httpResponse && httpResponse.statusCode != 200) {
                logger.error('REST call error: ' + httpResponse.statusCode + ' for ' + options.url);
                response.setValue("ERROR");
                response.send();
                return;
            }

            try {
                body = JSON.parse(body);
                response.setValue(body['name']);
            } catch (err) {
                logger.error('Malformed JSON response from ' + options.url + ': ' + err.message);
                response.setValue("ERROR");
            }

            response.send();
        });
    });
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});

vectorWatch.createServer();
