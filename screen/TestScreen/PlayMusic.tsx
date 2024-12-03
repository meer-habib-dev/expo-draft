import { Alert, Button, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import axios from "axios";
import DeviceInfo from "react-native-device-info";

const PlayMusic = () => {
  const [accessToken, setAccessToken] = useState(
    "BQAi-3RLJHS3bCFaLzbM7crW1dP5c0FCOSSyAnsMeTH7_oi3Mqdp1bDwvaBWNEBhB00t8PSh52rFtG0YKxb5eUnwItGZZTpogZKRSTKnK9Jh8V4R3pU_mrbbSJG7Hkvr-frMFITM3yMwOXsG5OwnzJP-9e2K9VRHCcbU1ehlYaz69pZz--0dUDaBIvozJLSkCHAuzBRSemDJmUccACYSrpB-_1ovXUKVXAty22lG"
  );
  const [deviceId, setDeviceId] = useState(
    "d43596cf500af40ce6a98472bb25515bde8e7be6"
  );
  const playTrack = async (spotifyUri: string, type = "track") => {
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

      console.log("Playback started successfully", response);
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

  useEffect(() => {
    const getDeviceId = async () => {
      const deviceId = await DeviceInfo.getUniqueId();
      console.log("Device ID", deviceId);
      setDeviceId(deviceId);
    };
    getDeviceId();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>PlayMusic</Text>
      <Button
        title="Play Track"
        onPress={() => playTrack("spotify:track:20I6sIOMTCkB6w7ryavxtO")}
      />
    </View>
  );
};

export default PlayMusic;

const styles = StyleSheet.create({});
