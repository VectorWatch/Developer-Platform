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

    response.send();
});

vectorWatch.on('subscribe', function(event, response) {
    // your stream was added to a watch face
    console.log('on subscribe');

    response.setValue("Hello World!");
    response.send();
});

vectorWatch.on('unsubscribe', function(event, response) {
    // your stream was removed from a watch face
    console.log('on unsubscribe');
});
