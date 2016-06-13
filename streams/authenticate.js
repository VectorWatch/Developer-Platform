"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var OAuth2Provider = require('vectorwatch-authprovider-oauth2');
var StorageProvider = require('vectorwatch-storageprovider');
var request = require('request');

var vectorWatch = new VectorWatch({
    streamUID: process.env.STREAM_UID,
    token: process.env.VECTOR_TOKEN
});

var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

var authProvider = new OAuth2Provider (storageProvider, {
    clientId: '***', // your App Id
    clientSecret: '***', // your App Secret

    accessTokenUrl: 'https://graph.facebook.com/oauth/access_token',
    authorizeUrl: 'https://www.facebook.com/dialog/oauth?response_type=code&scope=public_profile',
    callbackUrl: window.location.href.replace(/developer\/stream/, 'authCallback')
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

        request(options, function(err, httpResponse, data) {
            if (err) {
                response.setValue("ERROR");
                logger.error(err);
            } else {
                try {
                    data = JSON.parse(data);
                    response.setValue(data['name']);
                } catch (err) {
                    response.setValue("ERROR");
                    return logger.error(err);
                }
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
