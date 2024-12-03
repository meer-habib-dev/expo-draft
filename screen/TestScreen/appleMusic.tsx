import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Button, Alert } from "react-native";
import {
  Auth,
  Player,
  MusicKit,
  useCurrentSong,
  useIsPlaying,
} from "@lomray/react-native-apple-music";

const AppleMusic = () => {
  // State to manage authentication and music library
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  // Current song and playback status hooks
  const { song } = useCurrentSong();
  const { isPlaying } = useIsPlaying();
  console.log("song", song);
  // Comprehensive authentication function
  async function authenticate() {
    try {
      // Check subscription first
      const subscriptionStatus = await Auth.checkSubscription();
      console.log("Subscription Status:", subscriptionStatus);

      // Perform authorization
      const authStatus = await Auth.authorize();
      console.log("Authorization Status:", authStatus);

      if (authStatus) {
        setIsAuthenticated(true);
        // Fetch tracks after successful authentication
        await getTracksFromLibrary();
      } else {
        Alert.alert(
          "Authentication Failed",
          "Unable to authenticate with Apple Music"
        );
      }
    } catch (error) {
      console.error("Authorization failed:", error);
      Alert.alert("Authentication Error", error.message);
    }
  }

  // Fetch tracks from user's library
  async function getTracksFromLibrary() {
    try {
      const results = await MusicKit.getTracksFromLibrary();
      console.log("User's library Results:", results);
      //   setLibraryTracks(results);
    } catch (error) {
      console.error("Getting user tracks failed:", error);
      Alert.alert("Library Error", "Failed to fetch library tracks");
    }
  }

  // Play a specific track
  async function playTrack(track) {
    if (!isAuthenticated) {
      Alert.alert("Not Authenticated", "Please authenticate first");
      return;
    }

    try {
      await Player.play(track);
      setCurrentSong(track);
    } catch (error) {
      console.error("Play track failed:", error);
      Alert.alert("Playback Error", "Unable to play the selected track");
    }
  }

  // Control playback methods
  const handlePlayPause = () => {
    if (isPlaying) {
      Player.pause();
    } else {
      Player.play();
    }
  };

  const skipToNextSong = () => {
    Player.skipToNextEntry();
  };

  const logOut = () => {
    Auth.logOut();
    setIsAuthenticated(false);
  };
  // Initial authentication on component mount
  useEffect(() => {
    authenticate();
  }, []);

  // Update current song when song changes
  useEffect(() => {
    if (song) {
      setCurrentSong(song);
    }
  }, [song]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apple Music Integration</Text>

      {/* Authentication Status */}
      <Text style={styles.statusText}>
        Authentication:{" "}
        {isAuthenticated ? "Authenticated" : "Not Authenticated"}
      </Text>

      {/* Current Song Display */}
      {currentSong && (
        <View style={styles.songInfo}>
          <Text>Now Playing:</Text>
          <Text>{currentSong?.title}</Text>
          <Text>Artist: {currentSong?.artist}</Text>
        </View>
      )}

      {/* Playback Controls */}
      <View style={styles.controlsContainer}>
        <Button
          title={isPlaying ? "Pause" : "Play"}
          onPress={handlePlayPause}
          disabled={!isAuthenticated}
        />
        <Button
          title="Next Song"
          onPress={skipToNextSong}
          disabled={!isAuthenticated}
        />
      </View>
      <Button title="Log Out" onPress={logOut} />
      {/* Library Tracks List */}
      <View style={styles.libraryContainer}>
        <Text style={styles.sectionTitle}>Your Library</Text>
        {(libraryTracks ?? [])?.map((track, index) => (
          <Button
            key={index}
            title={`${track?.title} - ${track?.artist}`}
            onPress={() => playTrack(track)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  statusText: {
    textAlign: "center",
    marginBottom: 15,
  },
  songInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  libraryContainer: {
    maxHeight: 200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default AppleMusic;
