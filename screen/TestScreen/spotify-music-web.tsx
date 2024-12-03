import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { WebView } from "react-native-webview";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
// Spotify API Configuration
const SPOTIFY_CLIENT_ID = "713a411c7bd3451a94bac349f0b234a8";
const SPOTIFY_REDIRECT_URI = "exp://localhost:19002/"; // e.g., exp://localhost:19000/--/spotify-auth
const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-modify-playback-state",
  "user-read-playback-state",
  "streaming",
].join(" ");

const SpotifyMusicPlayer = () => {
  const [authCode, setAuthCode] = useState(null);
  const [accessToken, setAccessToken] = useState(
    "BQAv-1sxzwa1MJukUHGzyV_OU5UPox62N4Gxgqxj0mIe3VMUKQeXBAUcDz6P_3io09c_4w9_aBvirlyG_jeedFKEaeAkA7o4AdhwYqD0NqH5IDI4Z4ZHktM9ctyj8AbpoltOA1KHG-E_zfv3mgqDWrYonEce3zs4zs_yrKP4pHOHXc08E0PydmhbASfvFIMLQ7hnWGsZ0BH12VHhKgHMRjoWU1np6ywlt75Nbo3S"
  );
  const [deviceId, setDeviceId] = useState(
    "9b5739f74b1404424746e2a1e65ba95be1f4cdf9"
  );
  const [refreshToken, setRefreshToken] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const webViewRef = useRef(null);

  // Generate PKCE challenge for secure authorization
  const generateCodeVerifier = async () => {
    const randomBytes = await Crypto.getRandomBytes(32);
    return randomBytes
      .map((byte) => byte.toString(36).padStart(2, "0"))
      .join("")
      .substring(0, 128);
  };

  const generateCodeChallenge = async (codeVerifier) => {
    const digest = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA256,
      new TextEncoder().encode(codeVerifier)
    );
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  // Initiate Spotify Authorization
  const initiateSpotifyAuth = async () => {
    try {
      const codeVerifier = await generateCodeVerifier();
      await SecureStore.setItemAsync("code_verifier", codeVerifier);

      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("redirect_uri", SPOTIFY_REDIRECT_URI);
      authUrl.searchParams.set("scope", SPOTIFY_SCOPES);
      authUrl.searchParams.set("code_challenge_method", "S256");
      authUrl.searchParams.set("code_challenge", codeChallenge);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl.toString(),
        SPOTIFY_REDIRECT_URI
      );

      if (result.type === "success") {
        const parsedUrl = new URL(result.url);
        const code = parsedUrl.searchParams.get("code");
        setAuthCode(code);
      }
    } catch (error) {
      console.error("Authentication Error:", error);
      Alert.alert(
        "Authentication Failed",
        "Unable to complete Spotify authentication"
      );
    }
  };

  // Exchange Authorization Code for Access Token
  const exchangeCodeForToken = async () => {
    if (!authCode) return;

    try {
      const codeVerifier = await SecureStore.getItemAsync("code_verifier");

      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: "authorization_code",
          code: authCode,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          code_verifier: codeVerifier || "",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, refresh_token } = tokenResponse.data;

      // Store tokens securely
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      await SecureStore.setItemAsync("refresh_token", refresh_token);
    } catch (error) {
      console.error("Token Exchange Error:", error);
      Alert.alert("Token Error", "Failed to exchange authorization code");
    }
  };

  // Play a track with improved error handling
  const playTrack = async (spotifyUri: string, type = "track") => {
    // if (!accessToken || !deviceId) {
    //   Alert.alert("Playback Error", "No active device or access token");
    //   return;
    // }

    try {
      // Determine the correct endpoint and payload based on URI type
      const playbackEndpoint = "https://api.spotify.com/v1/me/player/play";
      let payload;

      switch (type) {
        case "playlist":
          payload = { context_uri: spotifyUri };
          break;
        case "album":
          payload = { context_uri: spotifyUri };
          break;
        case "track":
        default:
          payload = { uris: [spotifyUri] };
      }

      // Add device ID to the request
      const response = await axios.put(
        `${playbackEndpoint}?device_id=${deviceId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Playback started successfully");
    } catch (error: any) {
      console.error(
        "Play Track Error:",
        error.response ? error.response.data : error
      );

      // More detailed error handling
      if (error.response) {
        switch (error.response.status) {
          case 404:
            Alert.alert(
              "Playback Error",
              "No active device found. Open Spotify on a device."
            );
            break;
          case 403:
            Alert.alert(
              "Playback Error",
              "Premium account required for playback."
            );
            break;
          case 401:
            // Token might be expired, attempt to refresh
            // await refreshAccessToken();
            break;
          default:
            Alert.alert("Playback Error", "Unable to start playback");
        }
      } else {
        Alert.alert("Network Error", "Check your internet connection");
      }
    }
  };

  // Initialize Spotify Playback SDK
  const initializeSpotifyPlayer = useCallback(() => {
    if (!accessToken) return null;
    console.log("is it here");
    const playerScript = `
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
          name: 'Expo Spotify Player',
          getOAuthToken: cb => { cb('${accessToken}'); },
          volume: 0.5
        });

        player.addListener('ready', ({ device_id }) => {
          window.postMessage(JSON.stringify({ 
            type: 'PLAYER_READY', 
            deviceId: device_id 
          }));
        });

        player.addListener('not_ready', ({ device_id }) => {
          window.postMessage(JSON.stringify({ 
            type: 'PLAYER_NOT_READY', 
            deviceId: device_id 
          }));
        });

        player.addListener('player_state_changed', state => {
          if (state) {
            window.postMessage(JSON.stringify({ 
              type: 'STATE_CHANGED', 
              paused: state.paused,
              track: state.track_window.current_track
            }));
          }
        });

        player.connect();
      };
    `;

    return (
      <WebView
        ref={webViewRef}
        // source={{ uri: "https://reactnative.dev/" }}
        style={{
          width: 200,
          height: 200,
          backgroundColor: "red",
        }}
        source={{
          html: `
            <html>
              <head>
                <script src="https://sdk.scdn.co/spotify-player.js"></script>
                <script>${playerScript}</script>
              </head>
              <body>
                <p>lorem ipsum dolor sit amet </p>
              </body>
            </html>
          `,
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log("data", data);
            switch (data.type) {
              case "PLAYER_READY":
                setPlayerReady(true);
                setDeviceId(data.deviceId);
                break;
              case "STATE_CHANGED":
                setIsPlaying(!data.paused);
                setCurrentTrack(data.track);
                break;
            }
          } catch (error) {
            console.error("WebView Message Error:", error);
          }
        }}
        onError={(error) => {
          console.error("WebView Error:", error);
        }}
        // style={{ width: "100%", height: "100%" }}
      />
    );
  }, [accessToken]);

  // Effect for handling authentication flow
  useEffect(() => {
    if (authCode) {
      exchangeCodeForToken();
    }
  }, [authCode]);

  return (
    <View style={styles.container}>
      {!accessToken ? (
        <TouchableOpacity
          style={styles.authButton}
          onPress={initiateSpotifyAuth}
        >
          <Text style={styles.authButtonText}>Connect Spotify</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.playerContainer}>
          {initializeSpotifyPlayer()}

          {currentTrack && (
            <View style={styles.trackInfo}>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {currentTrack?.name}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {currentTrack?.artists[0]?.name}
              </Text>
            </View>
          )}

          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() =>
                playTrack("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M", "playlist")
              }
            >
              <Text>Play Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() =>
                playTrack("spotify:track:20I6sIOMTCkB6w7ryavxtO", "track")
              }
            >
              <Text>Play Track</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1DB954",
  },
  authButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 30,
  },
  authButtonText: {
    color: "#1DB954",
    fontWeight: "bold",
  },
  playerContainer: {
    alignItems: "center",
  },
  trackInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  trackArtist: {
    fontSize: 14,
    color: "white",
  },
  controlButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
  },
  controlButton: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
  },
});

export default SpotifyMusicPlayer;
// import React, { useState, useEffect, useCallback } from "react";
// import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
// import { WebView } from "react-native-webview";
// import * as WebBrowser from "expo-web-browser";
// import * as Crypto from "expo-crypto";
// import * as SecureStore from "expo-secure-store";
// import axios from "axios";

// // Spotify API Configuration
// const SPOTIFY_CLIENT_ID = "713a411c7bd3451a94bac349f0b234a8";
// const SPOTIFY_REDIRECT_URI = "exp://localhost:19002/"; // e.g., exp://localhost:19000/--/spotify-auth
// const SPOTIFY_SCOPES = [
//   "user-read-private",
//   "user-read-email",
//   "user-modify-playback-state",
//   "user-read-playback-state",
//   "streaming",
// ].join(" ");

// const SpotifyMusicPlayer = () => {
//   const [authCode, setAuthCode] = useState(true);
//   const [accessToken, setAccessToken] = useState(
//     "BQCbJNX4QjsV9Vcdg1apWWVysUI62arQ25023C64ClwnmxJXYR87afSV8i34ER42-De_CAouR3VRbFTVFQQMgYXR18wT8I4WUqrfPP9THCC1s0GRmu6c8vA6xVxzlTHBg1R6KiSTCbGNEPOF3d6zoYJPiKMwXvRZ_KSj8tCKZuCgMxwSotUu5PjSFmpQ6hZS5_COSrNbF0E-6y_AdagsLVBADZEZCtiTGs1ItXM2"
//   );
//   const [refreshToken, setRefreshToken] = useState(null);
//   const [playerReady, setPlayerReady] = useState(false);
//   const [currentTrack, setCurrentTrack] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);

//   // Generate PKCE challenge for secure authorization
//   const generateCodeVerifier = async () => {
//     const randomBytes = await Crypto.getRandomBytes(32);
//     return randomBytes
//       .map((byte) => byte.toString(36).padStart(2, "0"))
//       .join("")
//       .substring(0, 128);
//   };

//   const generateCodeChallenge = async (codeVerifier: string) => {
//     const digest = await Crypto.digest(
//       Crypto.CryptoDigestAlgorithm.SHA256,
//       new TextEncoder().encode(codeVerifier)
//     );
//     return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
//       .replace(/\+/g, "-")
//       .replace(/\//g, "_")
//       .replace(/=+$/, "");
//   };

//   // Initiate Spotify Authorization
//   const initiateSpotifyAuth = async () => {
//     try {
//       const codeVerifier = await generateCodeVerifier();
//       await SecureStore.setItemAsync("code_verifier", codeVerifier);

//       const codeChallenge = await generateCodeChallenge(codeVerifier);

//       const authUrl = new URL("https://accounts.spotify.com/authorize");
//       authUrl.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
//       authUrl.searchParams.set("response_type", "code");
//       authUrl.searchParams.set("redirect_uri", SPOTIFY_REDIRECT_URI);
//       authUrl.searchParams.set("scope", SPOTIFY_SCOPES);
//       authUrl.searchParams.set("code_challenge_method", "S256");
//       authUrl.searchParams.set("code_challenge", codeChallenge);

//       const result = await WebBrowser.openAuthSessionAsync(
//         authUrl.toString(),
//         SPOTIFY_REDIRECT_URI
//       );

//       console.log("result", result);
//       if (result.type === "success") {
//         const parsedUrl = new URL(result.url);
//         const code = parsedUrl.searchParams.get("code");
//         setAuthCode(code);
//       }
//     } catch (error) {
//       console.error("Error initiating Spotify auth:", JSON.stringify(error));
//     }
//   };

//   // Exchange Authorization Code for Access Token
//   const exchangeCodeForToken = async () => {
//     console.log("authCode", authCode);
//     if (!authCode) return;

//     try {
//       const codeVerifier = await SecureStore.getItemAsync("code_verifier");

//       const tokenResponse = await axios.post(
//         "https://accounts.spotify.com/api/token",
//         new URLSearchParams({
//           client_id: SPOTIFY_CLIENT_ID,
//           grant_type: "authorization_code",
//           code: authCode,
//           redirect_uri: SPOTIFY_REDIRECT_URI,
//           code_verifier: codeVerifier || "",
//         }),
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );
//       console.log("tokenResponse", tokenResponse);

//       const { access_token, refresh_token } = tokenResponse.data;

//       // Store tokens securely
//       setAccessToken(
//         "BQCiE0wJxbeccDB5TKFlRmr5-795MwMqmAJbwCXHH6E52GrckC7BccqgLbm30uNVTh_Ev5NbussAEhXmFRTg8cfxHYftR_jfFiryxO2t2GsEI7QLALIqjcgKwy8MK8NQdOxwA-SGyG--wox9zKpAnLraXIZOm2D1OGoeSjPAJGeWM-edWEKsuXk5SJZcqw4P_ej_AkWUogKvWDiw8cR-CfNfsoqvATiR5W0-IwCM"
//       );
//       setRefreshToken(refresh_token);
//       await SecureStore.setItemAsync("refresh_token", refresh_token);
//     } catch (error) {
//       console.error("Token Exchange Error:", error);
//     }
//   };

//   // Refresh Access Token
//   const refreshAccessToken = async () => {
//     try {
//       const storedRefreshToken = await SecureStore.getItemAsync(
//         "refresh_token"
//       );

//       const refreshResponse = await axios.post(
//         "https://accounts.spotify.com/api/token",
//         new URLSearchParams({
//           client_id: SPOTIFY_CLIENT_ID,
//           grant_type: "refresh_token",
//           refresh_token: storedRefreshToken,
//         }),
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );

//       const { access_token } = refreshResponse.data;
//       setAccessToken(access_token);
//     } catch (error) {
//       console.error("Token Refresh Error:", error);
//       // Initiate re-authentication if refresh fails
//       initiateSpotifyAuth();
//     }
//   };

//   // Initialize Spotify Playback
//   const initializeSpotifyPlayer = useCallback(() => {
//     if (!accessToken) return;

//     const script = `
//       window.onSpotifyWebPlaybackSDKReady = () => {
//         const player = new Spotify.Player({
//           name: 'Expo Spotify Player',
//           getOAuthToken: cb => { cb('${accessToken}'); },
//           volume: 0.5
//         });

//        player.connect().then(success => {
//           if (success) {
//             console.log('The Web Playback SDK successfully connected to Spotify!');
//           }
//         });

//         player.addListener("ready", ({ device_id }) => {
//           window.deviceId = device_id;
//           window.postMessage(JSON.stringify({
//             type: 'PLAYER_READY',
//             deviceId: device_id
//           }));
//         });

//         player.addListener('not_ready', ({ device_id }) => {
//           window.postMessage(JSON.stringify({
//             type: 'PLAYER_NOT_READY',
//             deviceId: device_id
//           }));
//         });

//         player.addListener('player_state_changed', state => {
//           if (state) {
//             window.postMessage(JSON.stringify({
//               type: 'STATE_CHANGED',
//               paused: state.paused,
//               track: state.track_window.current_track
//             }));
//           }
//         });

//         player.connect();
//       };
//     `;

//     return (
//       <WebView
//         source={{
//           html: `
//             <html>
//               <head>
//                 <script src="https://sdk.scdn.co/spotify-player.js"></script>
//                 <script>${script}</script>
//               </head>
//               <body></body>
//             </html>
//           `,
//         }}
//         onMessage={(event) => {
//           const data = JSON.parse(event.nativeEvent.data);
//           console.log("data", data);
//           switch (data.type) {
//             case "PLAYER_READY":
//               setPlayerReady(true);
//               break;
//             case "STATE_CHANGED":
//               setIsPlaying(!data.paused);
//               setCurrentTrack(data.track);
//               break;
//           }
//         }}
//         style={{ width: 0, height: 0 }}
//       />
//     );
//   }, [accessToken]);

//   // Play a track
//   const playTrack = async (spotifyUri: string) => {
//     if (!accessToken) return;

//     try {
//       await axios.put(
//         "https://api.spotify.com/v1/me/player/play",
//         { context_uri: "spotify:album:5ht7ItJgpBH7W6vJ5BqpPr" },
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//     } catch (error) {
//       console.error("Play Track Error:", error);
//     }
//   };

//   // Handle authentication flow
//   useEffect(() => {
//     if (authCode) {
//       // exchangeCodeForToken();
//     }
//   }, [authCode]);

//   // Periodic token refresh
//   useEffect(() => {
//     const tokenRefreshInterval = setInterval(() => {
//       if (refreshToken) {
//         refreshAccessToken();
//       }
//     }, 50 * 60 * 1000); // Refresh every 50 minutes

//     return () => clearInterval(tokenRefreshInterval);
//   }, [refreshToken]);

//   return (
//     <View style={styles.container}>
//       {!accessToken ? (
//         <TouchableOpacity
//           style={styles.authButton}
//           onPress={initiateSpotifyAuth}
//         >
//           <Text style={styles.authButtonText}>Connect Spotify</Text>
//         </TouchableOpacity>
//       ) : (
//         <View style={styles.playerContainer}>
//           {initializeSpotifyPlayer()}

//           {currentTrack && (
//             <View style={styles.trackInfo}>
//               <Text style={styles.trackTitle}>{currentTrack?.name}</Text>
//               <Text style={styles.trackArtist}>
//                 {currentTrack?.artists[0].name}
//               </Text>
//             </View>
//           )}

//           <View style={styles.controlButtons}>
//             <TouchableOpacity
//               style={styles.controlButton}
//               onPress={() => playTrack("spotify:playlist:YOUR_PLAYLIST_ID")}
//             >
//               <Text>Play Playlist</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.controlButton}
//               onPress={() => playTrack("spotify:album:YOUR_ALBUM_ID")}
//             >
//               <Text>Play Album</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "#1DB954", // Spotify green
//   },
//   authButton: {
//     backgroundColor: "white",
//     padding: 15,
//     borderRadius: 30,
//   },
//   authButtonText: {
//     color: "#1DB954",
//     fontWeight: "bold",
//   },
//   playerContainer: {
//     alignItems: "center",
//   },
//   trackInfo: {
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   trackTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "white",
//   },
//   trackArtist: {
//     fontSize: 14,
//     color: "white",
//   },
//   controlButtons: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     width: "80%",
//   },
//   controlButton: {
//     backgroundColor: "white",
//     padding: 10,
//     borderRadius: 20,
//   },
// });

// export default SpotifyMusicPlayer;
