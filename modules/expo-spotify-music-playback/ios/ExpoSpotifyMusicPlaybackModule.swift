import ExpoModulesCore
import SpotifyiOS

public class ExpoSpotifyMusicPlaybackModule: Module {
    let spotifySession = ESMConfigure.shared
  public func definition() -> ModuleDefinition {
    Name("ExpoSpotifyMusicPlayback")
    Events("setAccessToken", "playTrack", "pauseTrack", "resumeTrack", "getCurrentTrack")
      AsyncFunction("initialize") { () in

      }
      
      Function("setAccessToken") { (token: String) -> Void in
          spotifySession.initialize(token: token)
          
      }

      Function("playTrack") { (trackUri: String) -> Void in
          spotifySession.playTrack(uri: trackUri)
          sendEvent("playTrack", [
            "uri": trackUri
          ])
      } 

      Function("pauseTrack") { () -> Void in
          spotifySession.pauseTrack()
          sendEvent("pauseTrack")
      }

      Function("resumeTrack") { () -> Void in
          spotifySession.resumeTrack()
          sendEvent("resumeTrack")
      }

      AsyncFunction("getCurrentTrack") { (promise: Promise) in
          spotifySession.getCurrentTrack { trackName in
              promise.resolve(trackName)
              self.sendEvent("getCurrentTrack", [
                "trackName": trackName
              ])
          }
      } 

  }
}
