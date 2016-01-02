# kodi-alexa-skill
Alexa Skill to Control Kodi

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

