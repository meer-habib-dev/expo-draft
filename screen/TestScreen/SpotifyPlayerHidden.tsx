import React, { useState, useEffect, useRef } from "react";
import { View, Button, Alert, Platform, Linking } from "react-native";
import { WebView } from "react-native-webview";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, exchangeCodeAsync } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const spotifyConfig = {
  clientId: "7a7da3b1782641feb9feab9ac6c6fb24", // Replace with your Spotify client ID
  usePKCE: false,
  clientSecret: "d06bf031715e43a78e112cdceb69597d",
  redirectUri: makeRedirectUri({
    scheme: "exp://localhost:19002/",
    native: "expodraft://",
  }),
  scopes: [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-modify-playback-state",
    "user-read-playback-state",
    // "user-read-recently-played",
    // "user-top-read",
    // "user-read-private",
    // "user-read-email",
  ],
};

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
  revocationEndpoint: "https://accounts.spotify.com/api/token/revoke",
};

interface SpotifyPlayerProps {
  trackUri: string;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  accessToken: accessTokenProp,
  trackUri,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    accessTokenProp
  );
  const webViewRef = useRef<WebView>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: spotifyConfig.clientId,
      scopes: spotifyConfig.scopes,
      usePKCE: false,
      redirectUri: spotifyConfig.redirectUri,
    },
    discovery
  );

  console.log("request", request, response);
  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;

      const getAccessToken = async () => {
        try {
          const tokenResult = await exchangeCodeAsync(
            {
              code,
              clientId: spotifyConfig.clientId,
              redirectUri: spotifyConfig.redirectUri,
              clientSecret: spotifyConfig.clientSecret,
            },
            discovery
          );

          console.log("tokenResult", tokenResult);
          setAccessToken(tokenResult.accessToken);
        } catch (error) {
          console.error("Error exchanging code for token:", error);
          Alert.alert("Error", "Failed to get access token from Spotify");
        }
      };

      getAccessToken();
    }
  }, [response]);

  // HTML content to load Spotify Web Playback SDK
  const spotifyPlayerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://sdk.scdn.co/spotify-player.js"></script>
      <script>
        let playerInitialized = false;
        
        window.onSpotifyWebPlaybackSDKReady = () => {
          if (playerInitialized) return;
          playerInitialized = true;
          
          const token = '${accessToken}';
          const player = new Spotify.Player({
            name: 'React Native Spotify Player',
            getOAuthToken: cb => { cb(token); },
            volume: 1.0
          });

          // Ready
          player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'device_id', 
              device_id: device_id
            }));
          });

          // Not Ready
          player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'not_ready', 
              device_id: device_id
            }));
          });

          // Error handling
          player.addListener('initialization_error', ({ message }) => {
            console.error('Init Error:', message);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Initialization error: ' + message
            }));
            // Try reconnecting after initialization error
            setTimeout(() => {
              player.connect();
            }, 2000);
          });

          player.addListener('authentication_error', ({ message }) => {
            console.error('Auth Error:', message);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Authentication error: ' + message
            }));
          });

          player.addListener('account_error', ({ message }) => {
            console.error('Account Error:', message);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Account error: ' + message
            }));
          });

          player.addListener('playback_error', ({ message }) => {
            console.error('Playback Error:', message);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Playback error: ' + message
            }));
          });

          // Playback status updates
          player.addListener('player_state_changed', state => {
            if (!state) {
              console.log('State is null');
              return;
            }
            console.log('Player State Changed:', state);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'state_change',
              paused: state.paused,
              track: state.track_window.current_track
            }));
          });


          document.getElementById('togglePlay').onclick = function() {
            player.togglePlay();
            player.activateElement();
          };
            player.connect();



          // // Connect the player
          // const connectPlayer = async () => {
          //   try {
          //     const success = await player.connect();
          //     if (success) {
          //       console.log('Player Connected Successfully');
          //       // Call activateElement after successful connection
          //       await player.activateElement();
          //       window.ReactNativeWebView.postMessage(JSON.stringify({
          //         type: 'connected'
          //       }));
          //     } else {
          //       console.error('Failed to connect player');
          //       window.ReactNativeWebView.postMessage(JSON.stringify({
          //         type: 'error',
          //         message: 'Failed to connect Spotify player'
          //       }));
          //       // Retry connection
          //       setTimeout(connectPlayer, 2000);
          //     }
          //   } catch (err) {
          //     console.error('Player Connect Error:', err);
          //     window.ReactNativeWebView.postMessage(JSON.stringify({
          //       type: 'error',
          //       message: err.message || 'Failed to connect Spotify player'
          //     }));
          //     // Retry connection
          //     setTimeout(connectPlayer, 2000);
          //   }
          // };

          // connectPlayer();
          // window.spotifyPlayer = player;

          // // Add play/pause functions that can be called from React Native
          // window.play = () => {
          //   if (!player) {
          //     window.ReactNativeWebView.postMessage(JSON.stringify({
          //       type: 'error',
          //       message: 'Player not initialized'
          //     }));
          //     return;
          //   }

          //   player.resume()
          //     .then(() => {
          //       console.log('Resumed playback');
          //     })
          //     .catch(err => {
          //       console.error('Resume failed:', err);
          //       window.ReactNativeWebView.postMessage(JSON.stringify({
          //         type: 'error',
          //         message: err.message || 'Failed to resume playback'
          //       }));
          //     });
          // };

          // window.pause = () => {
          //   if (!player) {
          //     window.ReactNativeWebView.postMessage(JSON.stringify({
          //       type: 'error',
          //       message: 'Player not initialized'
          //     }));
          //     return;
          //   }

          //   player.pause()
          //     .then(() => {
          //       console.log('Paused playback');
          //     })
          //     .catch(err => {
          //       console.error('Pause failed:', err);
          //       window.ReactNativeWebView.postMessage(JSON.stringify({
          //         type: 'error',
          //         message: err.message || 'Failed to pause playback'
          //       }));
          //     });
          // };

          // document.getElementById('togglePlay').onclick = function() {
          //   player.togglePlay();
          // };
        };
      </script>
    </head>
    <body style="margin:0; padding:0;">
      <div
        id="player"
        style="height: 600px; width: 600px; background-color: grey; display: flex; justify-content: center; align-items: center;"
      >
        <button id="togglePlay">Toggle Play</button>
      </div>
    </body>
    </html>
  `;

  const playTrack = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please login to Spotify first");
      return;
    }

    console.log("playTrack", deviceId);
    if (!deviceId) {
      Alert.alert("Error", "Spotify player not ready yet");
      return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            uris: [trackUri],
          }),
        }
      );

      if (response.status === 401) {
        throw new Error("Unauthorized - Please check your Spotify permissions");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to play track");
      }

      setIsPlaying(true);
    } catch (error: any) {
      console.error("Error playing track:", error);
      if (error.message.includes("Unauthorized")) {
        Alert.alert(
          "Permission Error",
          "Please ensure you have granted the necessary Spotify permissions",
          [
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "android") {
                  Linking.openSettings();
                }
              },
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert(
          "Playback Error",
          error.message ||
            "Failed to play track. Please ensure you have an active Spotify Premium subscription and the required permissions."
        );
      }
    }
  };

  const pauseTrack = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/pause",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        throw new Error("Unauthorized - Please check your Spotify permissions");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to pause track");
      }

      setIsPlaying(false);
      webViewRef.current?.injectJavaScript("window.pause();");
    } catch (error: any) {
      console.error("Error pausing track:", error);
      if (error.message.includes("Unauthorized")) {
        Alert.alert(
          "Permission Error",
          "Please ensure you have granted the necessary Spotify permissions",
          [
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "android") {
                  Linking.openSettings();
                }
              },
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert("Playback Error", error.message || "Failed to pause track");
      }
    }
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("Received message:", data);

      switch (data.type) {
        case "device_id":
          console.log("Spotify Player Device ID:", data.device_id);
          setDeviceId(data.device_id);
          setIsPlayerReady(true);
          break;
        case "connected":
          console.log("Spotify Player Connected");
          // Don't set player ready until we get a device ID
          break;
        case "state_change":
          setIsPlaying(!data.paused);
          break;
        case "error":
          console.error("Spotify Player Error:", data.message);
          // Don't show alert for initialization errors as we're handling retries
          if (!data.message.includes("Initialization error")) {
            if (data.message.includes("Unauthorized")) {
              Alert.alert(
                "Permission Error",
                "Please ensure you have granted the necessary Spotify permissions",
                [
                  {
                    text: "Open Settings",
                    onPress: () => {
                      if (Platform.OS === "android") {
                        Linking.openSettings();
                      }
                    },
                  },
                  { text: "OK" },
                ]
              );
            } else {
              Alert.alert("Spotify Error", data.message);
            }
          }
          break;
        case "not_ready":
          console.log("Player not ready, device id:", data.device_id);
          setDeviceId(null);
          setIsPlayerReady(false);
          break;
      }
    } catch (error: any) {
      console.error("Error handling message:", error);
    }
  };

  console.log("deviceId", deviceId, accessToken);
  return (
    <View
      style={{
        height: 500,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {!accessToken ? (
        <Button
          title="Login to Spotify"
          onPress={() => promptAsync()}
          disabled={!request}
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ html: spotifyPlayerHTML }}
            onMessage={handleMessage}
            style={{
              marginTop: 40,
              height: 600,
              width: 600,
            }}
            originWhitelist={["*"]}
            javaScriptEnabled={true}
            mediaPlaybackRequiresUserAction={false} // For auto-play
            allowsInlineMediaPlayback // iOS: Enable inline playback
            androidLayerType={
              Platform.OS === "android" ? "hardware" : undefined
            }
          />
          <Button
            title={isPlaying ? "Pause" : "Play"}
            onPress={isPlaying ? pauseTrack : playTrack}
            disabled={!isPlayerReady}
          />
        </>
      )}
    </View>
  );
};

export default SpotifyPlayer;
