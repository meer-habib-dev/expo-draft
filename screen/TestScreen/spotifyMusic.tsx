import { Button, StyleSheet, Text, View } from "react-native";
import React from "react";

import {
  auth as SpotifyAuth,
  remote as SpotifyRemote,
  ApiScope,
  ApiConfig,
} from "react-native-spotify-remote";
const spotifyConfig: ApiConfig = {
  clientID: "713a411c7bd3451a94bac349f0b234a8",
  redirectURL: "myapp://",
  tokenRefreshURL: "https://accounts.spotify.com/api/token",
  tokenSwapURL: "https://accounts.spotify.com/api/token",
  scopes: [ApiScope.AppRemoteControlScope, ApiScope.UserFollowReadScope],
};
const SpotifyMusic = () => {
  // Api Config object, replace with your own applications client id and urls

  // Initialize the library and connect the Remote
  // then play an epic song
  async function playEpicSong() {
    try {
      const session = await SpotifyAuth.authorize(spotifyConfig);
      await SpotifyRemote.connect(session.accessToken);
      await SpotifyRemote.playUri("spotify:track:6IA8E2Q5ttcpbuahIejO74");
      await SpotifyRemote.seek(58000);
    } catch (err) {
      console.error("Couldn't authorize with or connect to Spotify", err);
    }
  }
  return (
    <View>
      <Button title="Play Epic Song" onPress={playEpicSong} />
    </View>
  );
};

export default SpotifyMusic;

const styles = StyleSheet.create({});
