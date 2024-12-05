import React, { useEffect, useState } from "react";
import { View, Button } from "react-native";
import SpotifyWebApi from "spotify-web-api-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SpotifyController = () => {
  const [spotifyApi, setSpotifyApi] = useState(null);

  useEffect(() => {
    const initSpotifyApi = async () => {
      const spotifyApi = new SpotifyWebApi();

      // Retrieve the access token from storage
      const accessToken = await AsyncStorage.getItem("spotify_access_token");

      if (accessToken) {
        spotifyApi.setAccessToken(accessToken);
        setSpotifyApi(spotifyApi);
      }
    };

    initSpotifyApi();
  }, []);

  const playTrack = async (trackUri) => {
    if (!spotifyApi) return;

    try {
      // Get the user's available devices
      const devices = await spotifyApi.getMyDevices();

      if (devices.devices.length === 0) {
        console.log("No active Spotify device found");
        return;
      }

      // Play the specific track on the first available device
      await spotifyApi.play({
        uris: [trackUri], // e.g., 'spotify:track:6rqhFgbbKwnb9MLmUQDhG6'
        device_id: devices.devices[0].id,
      });
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const pausePlayback = async () => {
    if (!spotifyApi) return;

    try {
      await spotifyApi.pause();
    } catch (error) {
      console.error("Error pausing playback:", error);
    }
  };

  const resumePlayback = async () => {
    if (!spotifyApi) return;

    try {
      await spotifyApi.play();
    } catch (error) {
      console.error("Error resuming playback:", error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button
        title="Play Track"
        onPress={() => playTrack("spotify:track:6rqhFgbbKwnb9MLmUQDhG6")}
      />
      <Button title="Pause" onPress={pausePlayback} />
      <Button title="Resume" onPress={resumePlayback} />
    </View>
  );
};

export default SpotifyController;
