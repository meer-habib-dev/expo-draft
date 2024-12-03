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
        appRemote = SPTAppRemote(configuration: configuration, logLevel: .debug)
        appRemote?.delegate = self
        appRemote?.connectionParameters.accessToken = token
        appRemote?.connect()
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
        
        appRemote.playerAPI?.getPlayerState { state , error in
            if let error = error {
                print("Error getting player state: \(error.localizedDescription)")
                completion(nil)
                return
            }
            print("state \(state ?? "")")
//            guard let trackName = state?.track.name else {
//                completion(nil)
//                return
//            }
//            
//            completion(trackName)
        }
    }
    
    // MARK: AppRemoteDelegate
    func appRemoteDidEstablishConnection(_ appRemote: SPTAppRemote) {
        // Connection was successful, you can begin issuing commands
        print("Connected to Spotify")
    }
    func appRemote(_ appRemote: SPTAppRemote, didFailConnectionAttemptWithError error: Error?) {
        // Connection failed
        print("Failed to connect to Spotify: \(error?.localizedDescription)")
    }
    func appRemote(_ appRemote: SPTAppRemote, didDisconnectWithError error: Error?) {
        // Connection disconnected
        print("Disconnected from Spotify")
    }
    
    // MARK: - SPTAppRemotePlayerStateDelegate
    
    func playerStateDidChange(_ playerState: SPTAppRemotePlayerState) {
        print("Player state changed: \(playerState.track.name)")
    }
}

// Example Usage in an Expo Module
public class SpotifyModule: Module {
    public func definition() -> ModuleDefinition {
        Name("SpotifyModule")
        
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
////
////  ESMConfigure.swift
////  Pods
////
////  Created by meer habib on 4/12/24.
////
//import ExpoModulesCore
//import SpotifyiOS
//
//final class ESMConfigure: NSObject {
//    var accessToken: String = ""
//    let configuration = SPTConfiguration(
//        clientID: "7a7da3b1782641feb9feab9ac6c6fb24",
//        redirectURL: URL(string: "expodraft://")!
//    )
//    var appRemote:SPTAppRemote?
//    static let shared = ESMConfigure()
//    
//    public func initialize(token: String) {
//        self.appRemote = SPTAppRemote(configuration: configuration, logLevel: .debug)
//        self.appRemote?.connectionParameters.accessToken = token
//
//        self.appRemote?.connect()
//        print("connected \(token) \(self.appRemote)")
//        
//    }
//}
