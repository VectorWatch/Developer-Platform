// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');
var OAuth2Provider = require('vectorwatch-authprovider-oauth2');
var StorageProvider = require('vectorwatch-storageprovider');

var vectorWatch = new VectorWatch({
    streamUID: process.env.STREAM_UID,
    token: process.env.VECTOR_TOKEN
});

var authProvider = new OAuth2Provider (StorageProvider, {
    clientId: ***, // your App Id
    clientSecret: ***, // your App Secret

    accessTokenUrl: 'https://graph.facebook.com/oauth/access_token',
    authorizeUrl: 'https://www.facebook.com/dialog/oauth?response_type=code&scope=public_profile'
});

vectorWatch.setStorageProvider(storageProvider);
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

    var settings = event.getUserSettings().settings;
    var channelLabel = event.getChannelLabel();

    event.getAuthTokensAsync().then(function(authTokens) {
        if (!authTokens) {
            response.sendInvalidAuthTokens();
        }

	var url = "https://graph.facebook.com/v2.6/me/?fields=id%2Cname";

        authProvider.get(url, authTokens.access_token, function (err, data) {
            if (err) {
    	        response.setValue("ERROR");
                logger.error(err); 
            } else {
                try {
                    var data = JSON.parse(data);
                    response.setValue(data['name']);
                } catch (err) {
                    return logger.error(err);
                }
            }
            response.send();
        });
    }
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
});

vectorWatch.createServer();
