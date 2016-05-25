// trigger the debugger so that you can easily set breakpoints
debugger;

var VectorWatch = require('vectorwatch-browser');

var vectorWatch = new VectorWatch({
    streamUID: process.env.STREAM_UID,
    token: process.env.VECTOR_TOKEN
});

var screens = [
    {
        name: "Degrees",
        type: 'Grid',
        values: [
            {label: "C"},
            {label: "F"},
        ]
    },
    {
        name: "Units",
        type: 'Grid',
        values: [
            {label: "Km"},
            {label: "Miles"},
        ]
    },
    {
        name: "Country",
        placeholder: "Enter a country name",
        type: "List",
        values: getCountriesList
    },
    {
        name: "City",
        placeholder: "Enter a city name",
        type: "Autocomplete",
        minChars: 3,
        values: getCitiesList
    }
];

function getCountriesList(settings) {
    return [
        {label: "Romania"},
        {label: "USA"},
        {label: "UK"}
    ];
}

function getCitiesList(settings, startName) {
    // start name = what the user entered so far.
    var ret = [];


    return ret;
}

vectorWatch.setConfigurationOoptions(screens);

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

/*

A more complex usecase

var screens = [
    {
        name: "Home",
        type: 'Grid',
        values: [
            {
                label: "Hello",
            },
            {
                label: "Hola"
            },
            {
                label: "Bonjour",
                nextScreen: "3rd"
            },
            {
                label: "Buna",
                final: true
            }
        ]    
    },
    {
        name: "2nd"
        type: 'Autocomplete',
        values: getSecondScreen
    },
    {
        name: '3rd'
        type: 'Grid',
        values: [
            {label: "1"},
            {label: "2"}
        ]
    }
}

function getSecondScreen(settings) {
    var ret;

    switch(settings['Home'].label) {
        case 'Hello':
            ret = [
                {label: "Friend", final: true},
                {label: "Vector", final: true},
                {label: "World", final: true}
            ];
            break;
        case 'Bienvenue':
            ret = [
                {label: "Mon Ami", final: true},
                {label: "Vector", final: true},
                {label: "Le Monde", final: true}
            ];
            break;
    }
    return ret;
}

*/
