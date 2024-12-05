import ExpoModulesCore
import SpotifyiOS

final class ESMConfigure: NSObject, SPTAppRemoteDelegate, SPTAppRemotePlayerStateDelegate {
    var accessToken: String = ""
    let configuration: SPTConfiguration
    var appRemote: SPTAppRemote?
    static let shared = ESMConfigure()
    
    override init() {
        configuration = SPTConfiguration(
            clientID: "7a7da3b1782641feb9feab9ac6c6fb24",
            redirectURL: URL(string: "expodraft://")!
        )
        super.init()
    }

    public func initialize(token: String) {
        print("Initializing with token: \(token)")
        // Store the access token
        self.accessToken = token
        
        // Initialize app remote if not already initialized
        if appRemote == nil {
            appRemote = SPTAppRemote(configuration: configuration, logLevel: .debug)
        }
        
       
        
        guard let appRemote = appRemote else {
            print("Failed to initialize AppRemote")
            return
        }
        
        // Set the access token and delegate
        
        appRemote.connectionParameters.accessToken = token
        appRemote.delegate = self

//                DispatchQueue.main.async { [weak self] in
//                    appRemote.authorizeAndPlayURI("spotify:track:6eUKZXaKkcviH0Ku9w2n3V")
//                }
        // Avoid reconnecting if already connected
         if appRemote.isConnected {
             print("App Remote is already connected")
             return
         }
         
         print("Attempting to connect to Spotify App Remote...")
         appRemote.connect()
    }
    
    public func isAvailable() {
        
    }

    public func connect(uri: String) {
//        DispatchQueue.main.async { [weak self] in
//            self?.appRemote?.authorizeAndPlayURI(uri)
//        }
        
        guard let appRemote = appRemote else {
              print("App Remote not initialized")
              return
          }
          
          DispatchQueue.main.async  {  
              if appRemote.isConnected {
                  print("App Remote is already connected, playing URI...")
                  appRemote.playerAPI?.play(uri)
              } else {
                  print("Authorizing and playing URI...")
                  appRemote.authorizeAndPlayURI(uri)
              }
          }
    }

    
    public func playTrack(uri: String) {
        guard let appRemote = appRemote, appRemote.isConnected else {
            print("Spotify App Remote is not connected")
            return
        }
        
        appRemote.playerAPI?.play(uri)
    }
    
    public func pauseTrack() {
        guard let appRemote = appRemote, appRemote.isConnected else {
            print("Spotify App Remote is not connected")
            return
        }
        
        appRemote.playerAPI?.pause()
    }
    
    public func resumeTrack() {
        guard let appRemote = appRemote, appRemote.isConnected else {
            print("Spotify App Remote is not connected")
            return
        }
        
        appRemote.playerAPI?.resume()
    }
    
    public func getCurrentTrack(completion: @escaping (String?) -> Void) {
        guard let appRemote = appRemote, appRemote.isConnected else {
            print("Spotify App Remote is not connected")
            completion(nil)
            return
        }
        
        appRemote.playerAPI?.getPlayerState { state, error in
            if let error = error {
                print("Error getting player state: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            guard let state = state else {
                completion(nil)
                return
            }
            
//            completion(state.track.name)
        }
    }
    
    // MARK: AppRemoteDelegate
    func appRemoteDidEstablishConnection(_ appRemote: SPTAppRemote) {
        print("LOG: Successfully Connected to Spotify App Remote")
        print("Connection Parameters: \(appRemote.connectionParameters)")
            appRemote.playerAPI?.delegate = self
            appRemote.playerAPI?.subscribe { result, error in
                if let error = error {
                    print("Error subscribing to player state: \(error.localizedDescription)")
                } else {
                    print("Subscribed to player state")
                }
            }
    }
    
    
    public func reconnect() {
        guard let appRemote = appRemote else { return }
        
        if appRemote.isConnected {
            appRemote.disconnect()
        }
        
        // Wait a moment before reconnecting
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.initialize(token: self.accessToken)
        }
    }
    
    func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
        print("LOG: Connection Attempt Failed")
          print("Detailed Error: \(String(describing: error))")
          print("Access Token: \(self.accessToken)")
          print("Is Connected: \(appRemote.isConnected)")
          print("Connection Parameters: \(appRemote.connectionParameters)")
    }
    
    func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
        print("LOG: Disconnected from Spotify")
    }
    
    // MARK: - SPTAppRemotePlayerStateDelegate
    func playerStateDidChange(_ playerState: SPTAppRemotePlayerState) {
        print("LOG: layer state changed: \(playerState.track.name)")
    }
}

// Example Usage in an Expo Module
public class SpotifyModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SpotifyModule")



        Function("initialize") { (token: String) in
            ESMConfigure.shared.initialize(token: token)
        }

        Function("connect") { (uri: String) in
            ESMConfigure.shared.connect(uri: uri)
        }   
        
        Function("playTrack") { (uri: String) in
            ESMConfigure.shared.playTrack(uri: uri)
        }
        
        Function("pauseTrack") {
            ESMConfigure.shared.pauseTrack()
        }
        
        Function("resumeTrack") {
            ESMConfigure.shared.resumeTrack()
        }
        
        AsyncFunction("getCurrentTrack") { (promise: Promise) in
            ESMConfigure.shared.getCurrentTrack { trackName in
                promise.resolve(trackName)
            }
        }
    }
}
