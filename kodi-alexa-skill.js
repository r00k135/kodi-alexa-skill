//********************************
// Name: kodi-alexa-skill.js
//********************************

//Imports
var http = require('http');
var fs = require('fs');
var doubleMetaphone = require('double-metaphone');

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
    } else if ("ScanLibraryIntent" === intentName) {
        scanKodiLibrary(intent, session, callback);
    } else if ("CleanLibraryIntent" === intentName) {
        cleanKodiLibrary(intent, session, callback);
    } else if ("HomeInputIntent" === intentName) {
        gotoKodiHome(intent, session, callback);
    } else if ("BackInputIntent" === intentName) {
        goBackInKodiGUI(intent, session, callback);
    } else if ("DownInputIntent" === intentName) {
        KodiDownGUI(intent, session, callback);
    } else if ("UpInputIntent" === intentName) {
        KodiUpGUI(intent, session, callback);
    } else if ("LeftInputIntent" === intentName) {
        KodiLeftGUI(intent, session, callback);
    } else if ("RightInputIntent" === intentName) {
        KodiRightGUI(intent, session, callback);
    } else if ("InfoInputIntent" === intentName) {
        KodiInfoGUI(intent, session, callback);
    } else if ("SelectInputIntent" === intentName) {
        KodiSelectGUI(intent, session, callback);
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
 * Kodi Show Info in GUI
 */
function KodiSelectGUI(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Select", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "OK";
            
        } else {
           speechOutput = "Kodi couldn't select";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Show Info in GUI
 */
function KodiInfoGUI(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Info", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "OK";
            
        } else {
           speechOutput = "Kodi couldn't show information";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Go Right in GUI
 */
function KodiRightGUI(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Right", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "OK";
            
        } else {
           speechOutput = "Kodi couldn't go right";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Go Left in GUI
 */
function KodiLeftGUI(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Left", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "OK";
            
        } else {
           speechOutput = "Kodi couldn't go left";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Go Up in GUI
 */
function KodiUpGUI(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Up", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "OK";
            
        } else {
           speechOutput = "Kodi couldn't go up";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Go Down in GUI
 */
function KodiDownGUI(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Down", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "OK";
            
        } else {
           speechOutput = "Kodi couldn't go down";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Go Back in GUI
 */
function goBackInKodiGUI(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Back", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "OK";
            
        } else {
           speechOutput = "Kodi couldn't go back";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Goto Home in GUI
 */
function gotoKodiHome(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "Input.Home", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "Kodi is on home screen";
            
        } else {
           speechOutput = "Kodi couldn't get to the home screen";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Clean Media Library.
 */
function cleanKodiLibrary(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "VideoLibrary.Clean", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "Kodi is cleaning media library";
            
        } else {
           speechOutput = "Kodi is not cleaning for media library";
        }
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
      });
    });
    req.write(post_data);
    req.end();
}


/**
 * Kodi Rescan Media Library.
 */
function scanKodiLibrary(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "method": "VideoLibrary.Scan", "id": 1}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
        var response_json = JSON.parse(chunk);
        if ( response_json.result === "OK" ) {
            speechOutput = "Kodi is scanning for new media";
            
        } else {
           speechOutput = "Kodi is not scanning for new media";
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
function startKodiMovie(intent, session, callback) {
    var cardTitle = intent.name;
    var MovieNameSlot = intent.slots.MovieName;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";


    if (MovieNameSlot.value) {
        console.log('MovieNameSlot Value: ' + MovieNameSlot.value);
        var slotCompare = buildMetaphone(MovieNameSlot.value);
        var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

        var post_data = '{"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "properties" : [ "tag" ] }, "id": "libMovies"}';
        var req = http.request(options, function(res) {
          var data = [];
          console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
          res.setEncoding('utf8');
          res.on('data', function (chunk) {
                data.push(chunk);
          });
          res.on('end', function () {
            var response_json = JSON.parse(data.join(''));
            //console.log('BODY: ' + JSON.stringify(response_json));
            if ( response_json.result.movies.length === 0 ) {
                speechOutput = "Kodi hasn't found any movies";
                callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            } else {
                console.log('Number of Movies Found: ' + response_json.result.movies.length);
                var matchedMovieId = 0;
                var matchedMovieLabel = "";
                for (var movie = 0; movie < response_json.result.movies.length; movie++) {
                    var new_record = {};
                    new_record.movieid = response_json.result.movies[movie].movieid;
                    new_record.label = response_json.result.movies[movie].label;
                    if (response_json.result.movies[movie].tag.length > 0) {
                        new_record.metaphone = response_json.result.movies[movie].tag[0];
                        console.log('Got metaphone from first Kodi tag: ' + new_record.metaphone);
                    }
                    else {
                        new_record.metaphone = buildMetaphone(new_record.label);    
                        // Store Metaphone as first Kodi Tag
                        storeKodiTag(new_record.movieid, new_record.metaphone);
                    }
                    if (slotCompare === new_record.metaphone) {
                        console.log('Movie Found: ' + JSON.stringify(new_record));        
                        matchedMovieId = new_record.movieid;
                        matchedMovieLabel = new_record.label;
                        // exit the loop
                        movie = response_json.result.movies.length;
                    }
                }
                if (matchedMovieId == 0) {
                    speechOutput = "I'm sorry, no movie found by the name "+MovieNameSlot.value;
                    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                } else {
                    // Play
                    var play_data = '{"jsonrpc":"2.0","method":"Player.Open","id":1,"params":{"item":{"movieid":'+matchedMovieId+'}}}';
                    var req = http.request(options, function(res) {
                      var play_response_data = [];
                      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + play_data);
                      res.setEncoding('utf8');
                      res.on('data', function (chunk) {
                            play_response_data.push(chunk);
                      });
                      res.on('end', function () {
                        var play_response_json = JSON.parse(play_response_data.join(''));
                        console.log('Play Response: ' + JSON.stringify(play_response_json)); 
                        speechOutput = "Found Movie "+matchedMovieLabel+ " playing";
                        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
                      });
                    });
                    req.write(play_data);
                    req.end();
                }
            }
          });
        });
        req.write(post_data);
        req.end();
    }
    else {
        console.log('MovieNameSlot Not Set');
        shouldEndSession = false;
        speechOutput = "Which movie would you like Kodi to play";
        repromptText = "Which movie would you like Kodi to play. You can tell the movie " +
            "saying, start movie cinderella";
        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }


}

/**
 * Build Metaphone String from input.
 */
 function buildMetaphone(input) {
    var output = input;
    var log = "";

    console.log('Metaphone: build string, input is ' + input);
    var stopwords = [
        "a",
        "about",
        "an",
        "are",
        "as",
        "at",
        "be",
        "by",
        "for",
        "from",
        "how",
        "in",
        "is",
        "it",
        "of",
        "on",
        "or",
        "that",
        "the",
        "this",
        "to",
        "was",
        "what",
        "when",
        "where",
        "will",
        "with",
    ];
    // lowercase the string
    output = output.toLowerCase();
    // remove full stops
    output = output.replace(/\./g, "");
    // remove full commas
    output = output.replace(/\,/g, " ");
    // remove dashes
    output = output.replace(/\-/g, " ");
    // remove plus symbols
    output = output.replace(/\+/g, " ");
    // check for number
    var numberMatchAr = output.match(/\d+/g);
    if (numberMatchAr !== null) {
        // Convert number
        log += "found number: "+JSON.stringify(numberMatchAr)+"\n";
        // Replace Numbers
        for (var num = 0; num < numberMatchAr.length; num++) {
            log += "  converting number: "+numberMatchAr[num]+"\n";
            var convertedNum = convert (parseInt(numberMatchAr[num]));
            log += "  converted number: "+convertedNum+"\n";
            output = output.replace(numberMatchAr[num], convertedNum);
        }
        log += "after converstion: "+output+"\n";
    }
    else {
        log += "no number found\n";
    }
    // trim whitespace
    output = output.trim();
    var prestopwords = output;
    // check wordcount
    var prestopwordslength = prestopwords.split(' ').length;
    log += "prestopwords: "+prestopwords+"\n";
    log += "prestopwordslength: "+prestopwordslength+"\n";
    // remove stopwords
    var outputAr = output.split(' ');
    var poststopwords = "";
    for (var word = 0; word < outputAr.length; word++) {
        var found = 0;
        for (var i = 0; i < stopwords.length; i++) {
            if (stopwords[i] === outputAr[word]) {
                found = 1;
            }
        }
        if (found === 0) {
            poststopwords += outputAr[word]+ " ";
        }
    }
    //remove double spaces
    poststopwords = poststopwords.replace("  ", " ");
    poststopwords = poststopwords.trim();
    // compare
    var poststopwordslength = poststopwords.split(' ').length;
    log += "poststopwords: "+poststopwords+"\n";
    log += "poststopwordslength: "+poststopwordslength+"\n";
    // check to make sure we still have a string left
    if (poststopwordslength === 0) {
        output = prestopwords;
        log += "putting stop words back in: "+output+"\n";
    }
    else {
        output = poststopwords;
        log += "staying with removed stopwords: "+output+"\n";
    }
    // replace words with metaphone
    var wordsAr = output.split(' ');
    var newOutput = "";
    for (var i = 0; i < wordsAr.length; i++) {
        var new_word = doubleMetaphone(wordsAr[i])[0];
        newOutput += new_word+ " ";
    }
    newOutput = newOutput.trim();
    //console.log('Metaphone: log: '+log);
    output = newOutput;
    console.log('Metaphone: output: '+output);
    return output;
 }


/*
* Convert Numbers to Words - helper functions
* Reference: http://stackoverflow.com/questions/5529934/javascript-numbers-to-words
*/
var ones=['','one','two','three','four','five','six','seven','eight','nine'];
var tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
var teens=['ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];


function convert_millions(num){
    if (num>=1000000){
        return convert_millions(Math.floor(num/1000000))+" million "+convert_thousands(num%1000000);
    }
    else {
        return convert_thousands(num);
    }
}

function convert_thousands(num){
    if (num>=1000){
        return convert_hundreds(Math.floor(num/1000))+" thousand "+convert_hundreds(num%1000);
    }
    else{
        return convert_hundreds(num);
    }
}

function convert_hundreds(num){
    if (num>99){
        return ones[Math.floor(num/100)]+" hundred "+convert_tens(num%100);
    }
    else{
        return convert_tens(num);
    }
}

function convert_tens(num){
    if (num<10) return ones[num];
    else if (num>=10 && num<20) return teens[num-10];
    else{
        return tens[Math.floor(num/10)]+" "+ones[num%10];
    }
}

function convert(num){
    if (num==0) return "zero";
    else return convert_millions(num);
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
 * Asks Kodi for recent movies.
 */
function storeKodiTag(movieid, tag) {
    var options = { host: kodiApiHost, port: kodiApiPort, path: KodiApiPath, method: 'POST', headers: { 'Content-Type': 'application/json' } };

    var post_data = '{"jsonrpc": "2.0", "id": 1, "method": "VideoLibrary.SetMovieDetails", "params": {"movieid" : '+movieid+', "tag" : ["'+tag+'"] }}';
    var req = http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode); console.log('HEADERS: ' + JSON.stringify(res.headers)); console.log('DATA: ' + post_data);
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        console.log('BODY: ' + chunk);
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
