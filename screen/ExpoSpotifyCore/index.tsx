import { StyleSheet, Text, View, Button, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Authenticate, isAvailable } from "@wwdrew/expo-spotify-sdk";

const Index = () => {
  const [token, setToken] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState("unknown");
  const [error, setError] = useState<string | null>(null);

  async function handleAuthenticatePress() {
    try {
      setAuthToken("unknown");
      const session = await Authenticate.authenticateAsync({
        scopes: [
          "ugc-image-upload",
          "user-read-playback-state",
          "user-modify-playback-state",
          "user-read-currently-playing",
          "app-remote-control",
          "streaming",
          "playlist-read-private",
          "playlist-read-collaborative",
          "playlist-modify-private",
          "playlist-modify-public",
          "user-follow-modify",
          "user-follow-read",
          "user-top-read",
          "user-read-recently-played",
          "user-library-modify",
          "user-library-read",
          "user-read-email",
          "user-read-private",
        ],
      });

      setAuthToken(session.accessToken);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert("Error", error.message);
      }
    }
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      {token ? (
        <View>
          <Text>Authenticated!</Text>
          <Text style={styles.token}>Token: {token.substring(0, 20)}...</Text>
        </View>
      ) : (
        <Button title="Connect to Spotify" onPress={handleAuthenticatePress} />
      )}
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  error: {
    color: "red",
    marginBottom: 20,
  },
  token: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
  },
});
