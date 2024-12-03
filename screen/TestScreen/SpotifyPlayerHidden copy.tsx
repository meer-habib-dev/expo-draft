import React, { useState, useEffect, useRef } from "react";
import { View, Button, Alert, Platform, Linking } from "react-native";
import { WebView } from "react-native-webview";

interface SpotifyPlayerProps {
  accessToken: string;
  trackUri: string;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  accessToken,
  trackUri,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

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

          // Connect the player
          const connectPlayer = async () => {
            try {
              const success = await player.connect();
              if (success) {
                console.log('Player Connected Successfully');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'connected'
                }));
              } else {
                console.error('Failed to connect player');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: 'Failed to connect Spotify player'
                }));
                // Retry connection
                setTimeout(connectPlayer, 2000);
              }
            } catch (err) {
              console.error('Player Connect Error:', err);
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: err.message || 'Failed to connect Spotify player'
              }));
              // Retry connection
              setTimeout(connectPlayer, 2000);
            }
          };

          connectPlayer();
          window.spotifyPlayer = player;

          // Add play/pause functions that can be called from React Native
          window.play = () => {
            if (!player) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: 'Player not initialized'
              }));
              return;
            }

            player.resume()
              .then(() => {
                console.log('Resumed playback');
              })
              .catch(err => {
                console.error('Resume failed:', err);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: err.message || 'Failed to resume playback'
                }));
              });
          };

          window.pause = () => {
            if (!player) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                message: 'Player not initialized'
              }));
              return;
            }

            player.pause()
              .then(() => {
                console.log('Paused playback');
              })
              .catch(err => {
                console.error('Pause failed:', err);
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: err.message || 'Failed to pause playback'
                }));
              });
          };
        };
      </script>
    </head>
    <body style="margin:0; padding:0;">
      <div id="player" style="height: 100px; width: 100px;"></div>
    </body>
    </html>
  `;

  const getDevices = async () => {
    try {
      const deviceResponse = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (deviceResponse.status === 401) {
        throw new Error("Unauthorized - Please check your Spotify permissions");
      }

      const data = await deviceResponse.json();
      console.log("deviceResponse", data);
    } catch (error: any) {
      console.error("Error getting devices:", error);
      if (error.message.includes("Unauthorized")) {
        Alert.alert(
          "Permission Error",
          "Please ensure you have granted the necessary Spotify permissions",
          [
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              }
            },
            { text: "OK" }
          ]
        );
      }
    }
  };

  useEffect(() => {
    getDevices();
  }, [accessToken]);

  const playTrack = async () => {
    console.log("playTrack", deviceId);
    if (!deviceId) {
      Alert.alert("Error", "Spotify player not ready yet");
      return;
    }

    try {
      //   First check if we have an active device
      const deviceResponse = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (deviceResponse.status === 401) {
        throw new Error("Unauthorized - Please check your Spotify permissions");
      }

      if (!deviceResponse.ok) {
        const errorData = await deviceResponse.json();
        throw new Error(errorData.error?.message || "Failed to get devices");
      }

      const deviceData = await deviceResponse.json();
      console.log("deviceData", deviceData);
      const isDeviceActive = deviceData.devices.some(
        (device: { id: string }) => device.id === deviceId
      );
      console.log("isDeviceActive", isDeviceActive);

      // Always transfer playback to ensure device is active
      const transferResponse = await fetch(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: false,
          }),
        }
      );

      if (transferResponse.status === 401) {
        throw new Error("Unauthorized - Please check your Spotify permissions");
      }

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json();
        throw new Error(
          errorData.error?.message || "Failed to transfer playback"
        );
      }

      // Wait a bit for the transfer to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Then start playback
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
      webViewRef.current?.injectJavaScript("window.play();");
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
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              }
            },
            { text: "OK" }
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
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              }
            },
            { text: "OK" }
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
                      if (Platform.OS === 'android') {
                        Linking.openSettings();
                      }
                    }
                  },
                  { text: "OK" }
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

  console.log("deviceId", deviceId);
  return (
    <View
      style={{ height: 500, justifyContent: "center", alignItems: "center" }}
    >
      <WebView
        ref={webViewRef}
        source={{ html: spotifyPlayerHTML }}
        onMessage={handleMessage}
        style={{ height: 10, width: 10, opacity: 0 }}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        androidLayerType={Platform.OS === "android" ? "hardware" : undefined}
      />
      <Button
        title={isPlaying ? "Pause" : "Play"}
        onPress={isPlaying ? pauseTrack : playTrack}
        disabled={!isPlayerReady}
      />
    </View>
  );
};

export default SpotifyPlayer;
