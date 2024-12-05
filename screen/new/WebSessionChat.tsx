import { StyleSheet, Text, View, Button, Alert, Linking } from "react-native";
import React, { useEffect, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const spotifyConfig = {
  clientId: "7a7da3b1782641feb9feab9ac6c6fb24",
  clientSecret: "d06bf031715e43a78e112cdceb69597d",
  scopes: [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-follow-read",
    "user-follow-modify",
    "user-library-read",
    "user-library-modify",
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "ugc-image-upload",
    "streaming",
    "app-remote-control",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
  ],
  redirectUri: makeRedirectUri({
    scheme: "exp://localhost:19002/",
    native: "expodraft://",
  }),
};

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

// const device = [
//   {
//     id: "0e6f6bdb86069e93bce67ad53d1cc49b59a1a92a",
//     is_active: true,
//     is_private_session: false,
//     is_restricted: false,
//     name: "meer habib’s iPhone",
//     supports_volume: false,
//     type: "Smartphone",
//     volume_percent: 100,
//   },
// ];

const WebSessionChat = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isCheckingDevices, setIsCheckingDevices] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: spotifyConfig.clientId,
      scopes: spotifyConfig.scopes,
      usePKCE: false,
      redirectUri: spotifyConfig.redirectUri,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      setAccessToken(access_token);
    }
  }, [response]);

  useEffect(() => {
    if (accessToken) {
      checkAvailableDevices();
    }
  }, [accessToken]);

  const activateSpotifyApp = async () => {
    try {
      // Attempt to open Spotify app as minimally as possible
      // Using a minimal intent that might wake the app without full visibility
      await Linking.openURL("spotify://");

      // Optional: You can use a more specific Spotify deep link if needed
      // await Linking.openURL('spotify://track/20I6sIOMTCkB6w7ryavxtO');

      console.log("Attempted to activate Spotify app in background");
    } catch (error) {
      console.error("Error attempting to activate Spotify app:", error);
    }
  };

  const checkAvailableDevices = async () => {
    if (!accessToken) return;

    try {
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = await response.json();
      setDevices(data?.devices || []);
      console.log("data", data);
      // If no active device found
      if (!data?.devices?.some((device: any) => device.is_active)) {
        // Attempt to silently activate Spotify
        await activateSpotifyApp();
        // Wait a short time and recheck devices
        // await new Promise((resolve) => setTimeout(resolve, 1500));
        // await checkAvailableDevices();
      } else {
        // Set the first active device
        const active = data.devices.find((device: any) => device.is_active);
        setActiveDevice(active.id);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    }
  };
  //   const checkAvailableDevices = async () => {
  //     if (!accessToken) return;

  //     setIsCheckingDevices(true);
  //     try {
  //       const response = await fetch(
  //         "https://api.spotify.com/v1/me/player/devices",
  //         {
  //           headers: {
  //             Authorization: `Bearer ${accessToken}`,
  //           },
  //         }
  //       );
  //       const data = await response.json();
  //       console.log("data", data);
  //       setDevices(data?.devices || []);

  //       // Set first active device found
  //       const active = data?.devices?.find((device: any) => device.is_active);
  //       if (active) {
  //         setActiveDevice(active.id);
  //       } else {
  //         // No active device found, attempt to open Spotify app
  //         await openSpotifyApp();

  //         // Wait a moment and then recheck devices
  //         // setTimeout(() => {
  //         //   checkAvailableDevices();
  //         // }, 2000);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching devices:", error);
  //       Alert.alert("Error", "Failed to fetch devices");
  //     } finally {
  //       setIsCheckingDevices(false);
  //     }
  //   };

  //   const openSpotifyApp = async () => {
  //     try {
  //       // Attempt to open Spotify app
  //       const spotifyUri = "spotify://";
  //       const supported = await Linking.canOpenURL(spotifyUri);

  //       if (supported) {
  //         await Linking.openURL(spotifyUri);
  //         console.log("Opened Spotify app");
  //       } else {
  //         Alert.alert("Error", "Spotify app is not installed");
  //       }
  //     } catch (error) {
  //       console.error("Error opening Spotify app:", error);
  //       Alert.alert("Error", "Failed to open Spotify app");
  //     }
  //   };

  const playMusic = async () => {
    if (!activeDevice || !accessToken) {
      console.error("No active device found or not authenticated");
      return;
    }

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${activeDevice}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: ["spotify:track:20I6sIOMTCkB6w7ryavxtO"], // Example track URI
          }),
        }
      );
      const data = await res.json();
      console.log("data", data);
      if (data.error.message === "Device not found") {
        await Linking.openURL(
          "spotify://track/20I6sIOMTCkB6w7ryavxtO?action=play&return-to=expodraft://"
        );
      }
    } catch (error) {
      console.error("Error playing music:", error);
    }
  };

  const handleAuthorize = async () => {
    try {
      const result = await promptAsync();

      if (result.type === "success") {
        const { code } = result.params;

        // Exchange code for access token
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            code,
            clientId: spotifyConfig.clientId,
            clientSecret: spotifyConfig.clientSecret,
            redirectUri: spotifyConfig.redirectUri,
          },
          discovery
        );

        setAccessToken(tokenResult.accessToken);
        console.log("tokenResult.accessToken", tokenResult.accessToken);
      }
    } catch (error) {
      console.error("Authorization failed:", error);
      Alert.alert("Error", "Failed to authorize with Spotify");
    }
  };
  useEffect(() => {
    const handleDeepLink = (event) => {
      const { url } = event;
      if (url) {
        console.log("App reopened with URL:", url);
        // Handle the redirection logic
      }
    };

    Linking.addEventListener("url", handleDeepLink);

    return () => {
      //   Linking.removeEventListener("url", handleDeepLink);
    };
  }, []);
  return (
    <View style={styles.container}>
      {!accessToken ? (
        <Button
          title="Login to Spotify"
          onPress={handleAuthorize}
          disabled={!request}
        />
      ) : (
        <>
          <Text style={styles.title}>Available Devices:</Text>
          {isCheckingDevices ? (
            <Text>Checking devices...</Text>
          ) : devices.length > 0 ? (
            devices.map((device: any) => (
              <Text key={device.id}>
                {device.name} ({device.is_active ? "Active" : "Inactive"})
              </Text>
            ))
          ) : (
            <Text>No devices found. Please open Spotify on a device.</Text>
          )}
          <Button
            title="Play Music"
            onPress={playMusic}
            disabled={!activeDevice}
          />
          <Button
            title="Recheck Devices"
            onPress={checkAvailableDevices}
            disabled={isCheckingDevices}
          />
          <Button
            title="Open Spotify"
            onPress={async () => {
              await Linking.openURL(
                "spotify://track/20I6sIOMTCkB6w7ryavxtO?action=play"
              );
              setTimeout(async () => {
                await Linking.openURL(
                  `spotify://?return-to=${spotifyConfig.redirectUri}`
                );
              }, 2000);
            }}
          />
          <Button
            title="Open Spotify And Back"
            onPress={async () => {
              setTimeout(async () => {
                await Linking.openURL(`${spotifyConfig.redirectUri}`);
              }, 2000);
              await Linking.openURL(`spotify://`);
            }}
          />
        </>
      )}
    </View>
  );
};

export default WebSessionChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
// import { StyleSheet, Text, View, Button, Alert } from "react-native";
// import React, { useEffect, useState } from "react";
// import * as AuthSession from "expo-auth-session";
// import * as WebBrowser from "expo-web-browser";
// import { makeRedirectUri } from "expo-auth-session";

// WebBrowser.maybeCompleteAuthSession();

// const spotifyConfig = {
//   clientId: "7a7da3b1782641feb9feab9ac6c6fb24",
//   clientSecret: "d06bf031715e43a78e112cdceb69597d",
//   scopes: [
//     // "streaming",
//     // "user-read-email",
//     // "user-read-private",
//     // "user-modify-playback-state",
//     // "user-read-playback-state",
//     "playlist-read-private",
//     "playlist-read-collaborative",
//     "playlist-modify-public",
//     "playlist-modify-private",
//     "user-follow-read",
//     "user-follow-modify",
//     "user-library-read",
//     "user-library-modify",
//     "user-read-email",
//     "user-read-private",
//     "user-top-read",
//     "ugc-image-upload",
//     "streaming",
//     "app-remote-control",
//     "user-read-playback-state",
//     "user-modify-playback-state",
//     "user-read-currently-playing",
//     "user-read-recently-played",
//   ],
//   redirectUri: makeRedirectUri({
//     scheme: "exp://localhost:19002/",
//     native: "expodraft://",
//   }),
// };

// const discovery = {
//   authorizationEndpoint: "https://accounts.spotify.com/authorize",
//   tokenEndpoint: "https://accounts.spotify.com/api/token",
// };

// const WebSessionChat = () => {
//   const [devices, setDevices] = useState<any[]>([]);
//   const [activeDevice, setActiveDevice] = useState<string | null>(null);
//   const [accessToken, setAccessToken] = useState<string | null>(null);

//   const [request, response, promptAsync] = AuthSession.useAuthRequest(
//     {
//       clientId: spotifyConfig.clientId,
//       scopes: spotifyConfig.scopes,
//       usePKCE: false,
//       redirectUri: spotifyConfig.redirectUri,
//     },
//     discovery
//   );

//   useEffect(() => {
//     if (response?.type === "success") {
//       const { access_token } = response.params;
//       setAccessToken(access_token);
//     }
//   }, [response]);

//   useEffect(() => {
//     if (accessToken) {
//       checkAvailableDevices();
//     }
//   }, [accessToken]);

//   const checkAvailableDevices = async () => {
//     if (!accessToken) return;

//     try {
//       const response = await fetch(
//         "https://api.spotify.com/v1/me/player/devices",
//         {
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//           },
//         }
//       );
//       const data = await response.json();
//       console.log("data", data);
//       setDevices(data?.devices);

//       // Set first active device found
//       const active = data?.devices?.find((device: any) => device.is_active);
//       if (active) {
//         setActiveDevice(active.id);
//       }
//     } catch (error) {
//       console.error("Error fetching devices:", error);
//     }
//   };

//   const playMusic = async () => {
//     if (!activeDevice || !accessToken) {
//       console.error("No active device found or not authenticated");
//       return;
//     }

//     try {
//       await fetch(
//         `https://api.spotify.com/v1/me/player/play?device_id=${activeDevice}`,
//         {
//           method: "PUT",
//           headers: {
//             Authorization: `Bearer ${accessToken}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             // You can specify track URIs, context URIs, etc here
//             uris: ["spotify:track:20I6sIOMTCkB6w7ryavxtO"], // Example track URI
//           }),
//         }
//       );
//     } catch (error) {
//       console.error("Error playing music:", error);
//     }
//   };

//   const handleAuthorize = async () => {
//     try {
//       const result = await promptAsync();

//       if (result.type === "success") {
//         const { code } = result.params;

//         // Exchange code for access token
//         const tokenResult = await AuthSession.exchangeCodeAsync(
//           {
//             code,
//             clientId: spotifyConfig.clientId,
//             clientSecret: spotifyConfig.clientSecret,
//             redirectUri: spotifyConfig.redirectUri,
//           },
//           discovery
//         );

//         setAccessToken(tokenResult.accessToken);
//         console.log("tokenResult.accessToken", tokenResult.accessToken);
//         // ExpoSpotifyMusicPlaybackModule.initialize(tokenResult.accessToken);
//       }
//     } catch (error) {
//       console.error("Authorization failed:", error);
//       Alert.alert("Error", "Failed to authorize with Spotify");
//     }
//   };
//   return (
//     <View style={styles.container}>
//       {!accessToken ? (
//         <Button
//           title="Login to Spotify"
//           onPress={handleAuthorize}
//           disabled={!request}
//         />
//       ) : (
//         <>
//           <Text style={styles.title}>Available Devices:</Text>
//           {devices?.map((device: any) => (
//             <Text key={device.id}>
//               {device.name} ({device.is_active ? "Active" : "Inactive"})
//             </Text>
//           ))}
//           <Button
//             title="Play Music"
//             onPress={playMusic}
//             disabled={!activeDevice}
//           />
//         </>
//       )}
//     </View>
//   );
// };

// export default WebSessionChat;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "white",
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
// });
