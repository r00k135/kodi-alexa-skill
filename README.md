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
* to stop playing - stop playing current media
* list movies - list last 8 movies added to media center
* start movie - start movie by name [not done]

## Install
Download latest code from github
> git clone https://github.com:r00k135/kodi-alexa-skill.git

Create an override file called: kodi-alexa-skill-override.json, use the following format and replace the defaults with your actual values so lamdba can access your kodi server:
```
{
	"kodiApiHost" : "<ip or dynamicDNS host name>",
	"kodiApiPort" : <HTTP Port Number - no speech marks needed>,
	"KodiApiPath" : "/<randomURL from Reverse Proxy>/jsonrpc",
	"applicationId" : "<applicationId>"
}
```

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
  > curl -s --data-binary '{"jsonrpc": "2.0", "method": "VideoLibrary.GetMovies", "params": { "filter": {"field": "playcount", "operator": "is", "value": "0"}, "properties" : ["imdbnumber"], "sort": { "order": "ascending", "method": "label", "ignorearticle": true } }, "id": "libMovies"}' -H 'content-type: application/json;' http://localhost/jsonrpc


## Appendix A: References

* https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference
* https://developer.amazon.com/appsandservices/solutions/alexa/alexa-skills-kit/docs/defining-the-voice-interface
* https://www.npmjs.com/package/double-metaphone
* http://kodi.wiki/view/JSON-RPC_API/v6
