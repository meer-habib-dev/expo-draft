import { Alert, Button, StyleSheet, Text, View } from "react-native";
import React from "react";

const SimpleApi = ({
  accessToken,
  deviceId,
  trackUri,
}: {
  accessToken: string;
  deviceId: string;
  trackUri: string;
}) => {
  const playTrack = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please login to Spotify first");
      return;
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play`,
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

      //   setIsPlaying(true);
    } catch (error: any) {
      console.error("Error playing track:", error);
      //   if (error.message.includes("Unauthorized")) {
      //     Alert.alert(
      //       "Permission Error",
      //       "Please ensure you have granted the necessary Spotify permissions",
      //       [
      //         {
      //           text: "Open Settings",
      //           onPress: () => {
      //             if (Platform.OS === "android") {
      //               Linking.openSettings();
      //             }
      //           },
      //         },
      //         { text: "OK" },
      //       ]
      //     );
      //   } else {
      //     Alert.alert(
      //       "Playback Error",
      //       error.message ||
      //         "Failed to play track. Please ensure you have an active Spotify Premium subscription and the required permissions."
      //     );
      //   }
    }
  };

  return (
    <View>
      <Button title="Login to Spotify" onPress={() => {}} />
    </View>
  );
};

export default SimpleApi;

const styles = StyleSheet.create({});
