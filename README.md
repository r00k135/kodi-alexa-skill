# kodi-alexa-skill
Alexa Skill to Control Kodi - Implemented in NodeJS

```
                     Firewall
                     +
                     |
                     |       +--+
                     |       |  |
    +------------------------+  |  Amazon
    |                |       |  |  Echo
+---v----+           |       |  |
|        |           |       +--+
|  AWS   |           |
| Lambda |           |
|        |           |       +---------+          +------------+
+---+----+           |       |         |          |            |
    |                |       | Reverse |          |            |
    +------------------------>  Proxy  +---------->    Kodi    |
                     |       |         |          |            |
                     |       |         |          |            |
                     |       +---------+          +------------+
                     |
                     + Reverse Proxy Maps /<randomURL> to / on Kodi

```


## Functions Implemented

Alexa, ask Kodi:

* whats playing / whats on - ask kodi what is currently playing
* to play / to pause - toggle between pause and play whilst playing back
* to stop - stop playing current media
* list movies - list last 8 movies added to media center
* start movie / play movie - start movie by name

## Install
Download latest code from github
> git clone https://github.com:r00k135/kodi-alexa-skill.git

Create an override file called: *kodi-alexa-skill-override.json*, use the following format and replace the defaults with your actual values so lamdba can access your kodi server:
```
{
	"kodiApiHost" : "<ip or dynamicDNS host name>",
	"kodiApiPort" : <HTTP Port Number - no speech marks needed>,
	"KodiApiPath" : "/<randomURL from Reverse Proxy>/jsonrpc",
	"applicationId" : "<applicationId>"
}
```

Ensure that you have the AWS Command Line Tools (CLI) configured (http://aws.amazon.com/tools/#AWS_Command_Line_Interface) with an IAM user who can update lambda function.

Create Lambda Function, as described here, called *kodi-control*: https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/deploying-a-sample-skill-to-aws-lambda#Creating%20the%20Lambda%20Function%20for%20the%20Sample

In order to build your zip file and upload, run the release.sh script:
> ./release.sh

## Kodi API
* Get Active Players
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "Player.GetActivePlayers", "id": 1}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Play Pause
  > curl -s --data-binary '{"jsonrpc":"2.0","method":"Player.PlayPause","id":1,"params":{"playerid":1}}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Play Stop
  > curl -s --data-binary '{"jsonrpc":"2.0","method":"Player.Stop","id":1,"params":{"playerid":1}}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Get Recently Added Movies
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "VideoLibrary.GetRecentlyAddedMovies", "params": { "limits": { "start" : 0, "end": 8 }, "properties" : ["imdbnumber"] }, "id": "libMovies"}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Get All Movies
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "sort": { "order": "ascending", "method": "label", "ignorearticle": true } }, "id": "libMovies"}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Get All Movies with Tags
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "properties" : [ "tag" ], "sort": { "order": "ascending", "method": "label", "ignorearticle": true } }, "id": "libMovies"}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Goto Home
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "Input.Home", "id": 1}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Go Back
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "Input.Back", "id": 1}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Scan for new media
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "VideoLibrary.Scan", "id": 1}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Clean media library
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "VideoLibrary.Clean", "id": 1}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Play Media
  > curl -s --data-binary '{"jsonrpc":"2.0","method":"Player.Open","id":1,"params":{"item":{"movieid":1}}}' -H 'content-type: application/json;' http://localhost/jsonrpc

* Set Tag
  > curl -s --data-binary '{"jsonrpc": "2.0", "id": 1, "method": "VideoLibrary.SetMovieDetails", "params": {"movieid" : 1, "tag" : ["TNT AT TS LTR"] }}' -H 'content-type: application/json;' http://localhost/jsonrpc

## Appendix A: References

* https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference
* https://developer.amazon.com/appsandservices/solutions/alexa/alexa-skills-kit/docs/defining-the-voice-interface
* https://www.npmjs.com/package/double-metaphone
* http://kodi.wiki/view/JSON-RPC_API/v6
* https://github.com/robnewton/JSON-RPC-Browser
* https://github.com/bwssytems/ha-bridge