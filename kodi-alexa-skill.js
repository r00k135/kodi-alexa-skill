//********************************
// Name: kodi-alexa-skill.js
//********************************

//Imports
var http = require('http');
var fs = require('fs');

// Kodi JSONRPC URL
var kodiApiHost = "<ip or dynamicDNS host name>";
var kodiApiPort = 80;
var KodiApiPath = "/<randomURL from Reverse Proxy>/jsonrpc";
// Alexa Application Id
var applicationId = "<applicationId>";
// Load Overrides File - Blocking
var overrides = JSON.parse(fs.readFileSync('kodi-alexa-skill-override.json', 'utf8'));
if (overrides) {
    kodiApiHost = overrides.kodiApiHost;
    kodiApiPort = overrides.kodiApiPort;
    KodiApiPath = overrides.KodiApiPath;
    applicationId = overrides.applicationId;
}


// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app."+applicationId) {
             context.fail("Invalid Application ID");
        }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if ("WhatsPlayingIntent" === intentName) {
        whatsPlayingOnKodi(intent, session, callback);
    } else if ("StopIntent" === intentName) {
        stopKodi(intent, session, callback);
    } else if ("PlayPauseIntent" === intentName) {
        playPauseKodi(intent, session, callback);
    } else if ("RecentMoviesIntent" === intentName) {
        recentKodiMovies(intent, session, callback);
    } else if ("StartMovieIntent" === intentName) {
        startKodiMovie(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "What would you like the Kodi Media Center to do, you can query whats playing by saying, whats playing";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "What would you kodi to do";
    var shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}


/**
 * Asks Kodi for recent movies.
 */
function startKodiMovie(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "filter": {"field": "playcount", "operator": "is", "value": "0"}, "sort": { "order": "ascending", "method": "label", "ignorearticle": true } }, "id": "libMovies"}';
    var req = http.request(options, function(res) {
      var data = [];
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
            data.push(chunk);
      });
      res.on('end', function () {
        var response_json = JSON.parse(data.join(''));
        console.log('BODY: ' + JSON.stringify(response_json));
        if ( response_json.result.movies.length === 0 ) {
            speechOutput = "Kodi hasn't found any movies";
        } else {
            speechOutput = "Kodi has found movies";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}



/**
 * Asks Kodi for recent movies.
 */
function recentKodiMovies(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "VideoLibrary.GetRecentlyAddedMovies", "params": { "limits": { "start" : 0, "end": 8 }, "properties" : ["imdbnumber"] }, "id": "libMovies"}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result.movies.length > 0 ) {
            speechOutput = "Kodi's recent movies are";
            for (var cnt = 0; cnt < response_json.result.movies.length; cnt++) {
                if (cnt == (response_json.result.movies.length-1)) {
                    speechOutput += ", and "+response_json.result.movies[cnt].label;
                }
                else {
                    speechOutput += ", "+response_json.result.movies[cnt].label;
                }
            }
        } else {
           speechOutput = "Kodi couldn't find any recent movies";
        }
        repromptText = "";
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}



/**
 * Asks Kodi Whats Playing.
 */
function whatsPlayingOnKodi(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Player.GetItem", "params": { "properties": ["title", "season", "episode", "duration"], "playerid": 1 }, "id": "VideoGetItem"}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result.item.type == "movie" ) {
            speechOutput = "Kodi is currently playing a movie called " + response_json.result.item.title;
        } else if ( response_json.result.item.type == "channel" ) {
            speechOutput = "Kodi is currently watching " + response_json.result.item.title + " on channel " + response_json.result.item.label;
        } else if ( response_json.result.item.type == "unknown" ) {
            speechOutput = "Kodi is not playing anything ";
        } else {
           speechOutput = "I couldn't tell what was playing";
        }
        repromptText = "";
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Stop Kodi Playing - check if anything is playing.
 */
function stopKodi(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result.length === 0 ) {
            speechOutput = "Kodi is already stopped";
            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        } else {
           executeKodiStop (intent, session, callback);
        }
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Execute Stop Kodi Playing.
 */
function executeKodiStop(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc":"2.0","method":"Player.Stop","id":1,"params":{"playerid":1}}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "Kodi has Stopped";
        } else {
           speechOutput = "Kodi didn't like that";
        }
        repromptText = "";
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Play or Pause Kodi - check if anything is playing
 */
function playPauseKodi(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result.length === 0 ) {
            speechOutput = "Kodi isn't playing anything";
            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        } else {
           executePlayPauseKodi (intent, session, callback);
        }
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Play or Pause Kodi.
 */
function executePlayPauseKodi(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc":"2.0","method":"Player.PlayPause","id":1,"params":{"playerid":1}}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result.speed === 0 ) {
            speechOutput = "Kodi has paused";
        } else if ( response_json.result.speed === 1 ) {
            speechOutput = "Kodi has resumed playback";
        } else {
           speechOutput = "Kodi didn't like that";
        }
        repromptText = "";
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
