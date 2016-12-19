"use strict";
// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-sdk');
var OAuth2Provider = require('vectorwatch-authprovider-oauth2');
var StorageProvider = require('vectorwatch-storageprovider');
var Schedule = require('node-schedule');
var request = require('request');

var vectorWatch = new VectorWatch();
var storageProvider = new StorageProvider();
vectorWatch.setStorageProvider(storageProvider);

var authProvider = new OAuth2Provider(storageProvider, {
    clientId: '********', // your App Id
    clientSecret: '*******', // your App Secret

    accessTokenUrl: 'https://www.googleapis.com/oauth2/v3/tokeninfo',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth?response_type=token&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fanalytics.readonly',
    callbackUrl: 'https://developer.vectorwatch.com/platform/authCallback/'+process.env.STREAM_UUID+'/' + process.env.VERSION
});
vectorWatch.setAuthProvider(authProvider);

var logger = vectorWatch.logger;

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    logger.info('on config');

    var account = response.createGridList('Account');
    account.setDynamic(true);

    var wp = response.createGridList('Web Property');
    wp.setDynamic(true);

    var profile = response.createGridList('Profile');
    profile.setDynamic(true);

    // var goal = response.createGridList('Goal');
    // goal.setDynamic(true);

    response.send();
});

vectorWatch.on('options', function(event, response) {
    // dynamic options for a specific setting name was requested
    logger.info('on options');

    var settings = event.getUserSettings().settings;
    var settingName = event.req.body.settingName;

    switch (settingName) {
        case 'Account':
            event.getAuthTokensAsync().then(function(authTokens) {
                if (!authTokens) {
                    logger.error('Invalid auth token');
                    response.sendInvalidAuthTokens();
                } else {
                    getAccountsList(authTokens.access_token).then(function(accounts) {
                        accounts = accounts.items;
                        for (var i = 0; i < accounts.length; i++) {
                            response.addOption(accounts[i]['name'], accounts[i]['id']);
                        }
                        response.send();
                    }).catch(function(streamText) {
                        response.addOption(streamText);
                        response.send();
                    });
                }
            }).catch(function(e) {
                logger.error(e);
                response.addOption("AUTHENTICATION ERROR");
                response.send();
            });
            break;
        case 'Web Property':
            event.getAuthTokensAsync().then(function(authTokens) {
                if (!authTokens) {
                    logger.error('Invalid auth token');
                    response.sendInvalidAuthTokens();
                } else {
                    getWebPropertiesList(authTokens.access_token, settings['Account'].value).then(function(wps) {
                        wps = wps.items;
                        for (var i = 0; i < wps.length; i++) {
                            response.addOption(wps[i]['name'], wps[i]['id']);
                        }
                        response.send();
                    }).catch(function(streamText) {
                        response.addOption(streamText);
                        response.send();
                    });
                }
            }).catch(function(e) {
                logger.error(e);
                response.addOption("AUTHENTICATION ERROR");
                response.send();
            });
            break;
        case 'Profile':
            event.getAuthTokensAsync().then(function(authTokens) {
                if (!authTokens) {
                    logger.error('Invalid auth token');
                    response.sendInvalidAuthTokens();
                } else {
                    getProfilesList(authTokens.access_token, settings['Account'].value, settings['Web Property'].value).then(function(profiles) {
                        profiles = profiles.items;
                        for (var i = 0; i < profiles.length; i++) {
                            response.addOption(profiles[i]['name'], profiles[i]['id']);
                        }
                        response.send();
                    }).catch(function(streamText) {
                        response.addOption(streamText);
                        response.send();
                    });
                }
            }).catch(function(e) {
                logger.error(e);
                response.addOption("AUTHENTICATION ERROR");
                response.send();
            });
            break;
        case 'Goal':
            event.getAuthTokensAsync().then(function(authTokens) {
                if (!authTokens) {
                    logger.error('Invalid auth token');
                    response.sendInvalidAuthTokens();
                } else {
                    getGoalsList(authTokens.access_token, settings['Account'].value, settings['Web Property'].value, settings['Profile'].value).then(function(goals) {
                        goals = goals.items;
                        for (var i = 0; i < goals.length; i++) {
                            response.addOption(goals[i]['name'], goals[i]['id']);
                        }
                        response.send();
                    }).catch(function(streamText) {
                        response.addOption(streamText);
                        response.send();
                    });
                }
            }).catch(function(e) {
                logger.error(e);
                response.addOption("AUTHENTICATION ERROR");
                response.send();
            });
            break;
      default:
            logger.error("Invalid setting name: " + settingName);
            response.addOption('INVALID SETTING');
            response.send();
    }

});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    logger.info('on subscribe');
    var settings = event.getUserSettings().settings;

    event.getAuthTokensAsync().then(function(authTokens) {
        if (!authTokens) {
            logger.error('Invalid auth token');
            response.sendInvalidAuthTokens();
        } else {
            getActiveUsersValue(authTokens.access_token, settings).then(function(goal) {
                response.setValue(goal['totalsForAllResults']['rt:activeUsers'] + ' active users');
                response.send();
            }).catch(function(streamText) {
                response.setValue(streamText);
                response.send();
            });
        }
    }).catch(function(e) {
        logger.error(e);
        response.setValue("AUTHENICATION ERROR");
        response.send();
    });
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    logger.info('on unsubscribe');
    response.send();
});

vectorWatch.on('schedule', function(records) {
    logger.info('on schedule');

    records.forEach(function(record) {
        getActiveUsersValue(record.authTokens.access_token, record.userSettings).then(function(goal) {
            record.pushUpdate(goal['totalsForAllResults']['rt:activeUsers'] + ' active users');
        }).catch(function(e) {
            logger.error(e);
            record.pushUpdate('ERROR');
        });
    });
});

function getAccountsList(access_token) {
    return google_request(access_token, 'https://www.googleapis.com/analytics/v3/management/accountSummaries');
}

function getWebPropertiesList(access_token, account_id) {
    return google_request(access_token, 'https://www.googleapis.com/analytics/v3/management/accounts/' + account_id + '/webproperties');
}

function getProfilesList(access_token, account_id, web_property_id) {
    return google_request(access_token, 'https://www.googleapis.com/analytics/v3/management/accounts/' + account_id + '/webproperties/' + web_property_id + '/profiles');
}

function getGoalsList(access_token, account_id, web_property_id, profile_id) {
    return google_request(access_token, 'https://www.googleapis.com/analytics/v3/management/accounts/' + account_id + '/webproperties/' + web_property_id + '/profiles/' + profile_id + '/goals');
}

function getActiveUsersValue(access_token, settings) {
    return google_request(access_token, 'https://www.googleapis.com/analytics/v3/data/realtime?ids=ga%3A' + settings['Profile'].value + '&metrics=rt%3AactiveUsers');
}

function google_request(access_token, url) {
    return new Promise(function(resolve, reject) {

        var options = {
            url: url,
            headers: {
                'Authorization': 'OAuth ' + access_token
            }
        };

        request(options, function(error, httpResponse, body) {
            if (error) {
                logger.error('REST call error: ' + error.message + ' for ' + options.url)
                reject("ERROR");
                return;
            }

            try {
                var bodyObject = JSON.parse(body);

                if (httpResponse && httpResponse.statusCode != 200) {
                    switch (httpResponse.statusCode) {
                        case 403:
                            reject("NOT AN ANALYTICS ACCOUNT");
                            return;
                    }
                    logger.error('REST call error: ' + httpResponse.statusCode + ' for ' + options.url);
                    reject("ERROR " + httpResponse.statusCode);
                    return;
                }

                resolve(bodyObject);
            } catch (err) {
                logger.error('Malformed JSON response from ' + options.url + ': ' + err.message);
                reject("ERROR");
            }

        });
    });
}

