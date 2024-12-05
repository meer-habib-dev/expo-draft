import { Button, StyleSheet, View, Alert } from "react-native";
import React, { useState } from "react";
import ExpoSpotifyMusicPlaybackModule from "@/modules/expo-spotify-music-playback/src/ExpoSpotifyMusicPlaybackModule";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const spotifyConfig = {
  clientId: "7a7da3b1782641feb9feab9ac6c6fb24",
  clientSecret: "d06bf031715e43a78e112cdceb69597d",
  scopes: [
    // "streaming",
    // "user-read-email",
    // "user-read-private",
    // "user-modify-playback-state",
    // "user-read-playback-state",
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

const ExpoSpotify = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: spotifyConfig.clientId,
      scopes: spotifyConfig.scopes,
      usePKCE: false,
      redirectUri: spotifyConfig.redirectUri,
    },
    discovery
  );

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
        // ExpoSpotifyMusicPlaybackModule.initialize(tokenResult.accessToken);
      }
    } catch (error) {
      console.error("Authorization failed:", error);
      Alert.alert("Error", "Failed to authorize with Spotify");
    }
  };

  const handleInitialize = async () => {
    ExpoSpotifyMusicPlaybackModule.initialize("Bearer " + (accessToken ?? ""));
  };

  const handlePlayTrack = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please authorize first");
      return;
    }
    ExpoSpotifyMusicPlaybackModule.playTrack(
      "spotify:track:6eUKZXaKkcviH0Ku9w2n3V"
    );
  };

  const handlePauseTrack = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please authorize first");
      return;
    }
    ExpoSpotifyMusicPlaybackModule.pauseTrack();
  };

  const handleResumeTrack = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please authorize first");
      return;
    }
    ExpoSpotifyMusicPlaybackModule.resumeTrack();
  };
  const handleConnect = async () => {
    ExpoSpotifyMusicPlaybackModule.connect(
      "spotify:track:6eUKZXaKkcviH0Ku9w2n3V"
    );
  };
  const handleGetCurrentTrack = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please authorize first");
      return;
    }
    ExpoSpotifyMusicPlaybackModule.getCurrentTrack();
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Authorize Spotify" onPress={handleAuthorize} />
      <Button title="Initialize" onPress={handleInitialize} />
      <Button title="Connect" onPress={handleConnect} />
      <Button title="Play Track" onPress={handlePlayTrack} />
      <Button title="Pause Track" onPress={handlePauseTrack} />
      <Button title="Resume Track" onPress={handleResumeTrack} />
      <Button title="Get Current Track" onPress={handleGetCurrentTrack} />
    </View>
  );
};

export default ExpoSpotify;

const styles = StyleSheet.create({});
