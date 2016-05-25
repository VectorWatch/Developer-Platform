// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');

var vectorWatch = new VectorWatch({
    streamUID: process.env.STREAM_UID,
    token: process.env.VECTOR_TOKEN
});

vectorWatch.on('config', function(event, response) {
    // your stream was just dragged onto a watch face
    console.log('on config');

    var what = response.createGridList('What');
    what.addOption('Hello');
    what.addOption('Bonjour');
    what.addOption('Hola');

    var who = response.createAutocomplete('Who');
    who.setDynamic(true);

    response.send();
});

vectorWatch.on('options', function(event, response) {
    // dynamic options for a specific setting name was requested
    console.log('on options');
    
    switch(event.req.body.settingName) {
        case 'Who':
            switch(event.req.body.userSettings[Who].name) {
                case 'Hello':
                    response.addOption("Frield");
                    response.addOption("Vector");
                    response.addOption("World");
                    break;
                case 'Bienvenue':
                    response.addOption("Mon Ami");
                    response.addOption("Vector");
                    response.addOption("Le Monde");
                    break;
                case 'Hola':
                    response.addOption("Amigo");
                    response.addOption("Vector");
                    response.addOption("Mundo");
                    break;
            }
            break;
    }

    return response;
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    console.log('on subscribe');

    var settings = event.getUserSettings().settings;
    var streamText = settings['What'].name + ' ' + settings['Who'].name;

    response.setValue(streamText);

    response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    console.log('on unsubscribe');
});
