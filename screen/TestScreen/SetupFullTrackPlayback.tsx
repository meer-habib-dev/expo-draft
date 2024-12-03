import { StyleSheet, Text, View, Button } from "react-native";
import React, { useEffect } from "react";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

// import TrackPlayer from "react-native-track-player";
// import TrackPlayer, { Capability } from "react-native-track-player";

interface SetupFullTrackPlaybackProps {
  accessToken: string;
  trackId: string;
}

const accessToken =
  "BQCLUGZ7GCesYuWLneBBUwAKOtZN2nAS663omnUH9NclKdIRdtGTA6Oi4esdD0-zYOYgktOP0l7h_3tqAzCPUSoQtRFPgol3i3Eo3gRrhKtlqJpq91x-gg4tedVfu0K_P0AWe3G8s1-8OAbK-hTYhbkuAIN39Hf2YxpuF9OHmQowc3zEC0Di04VHxbRniK_-PYwwfezhvHb6DDu8T8KusW9Q3Nx6PchEaJn1aB34";
const trackId = "spotify:track:5zCnGtCl5Ac5zlFHXaZmhy";
const SetupFullTrackPlayback: React.FC<SetupFullTrackPlaybackProps> = ({}) => {
  useEffect(() => {
    // Initialize TrackPlayer on component mount
    const setupPlayer = async () => {
      //   try {
      //     await TrackPlayer.setupPlayer({
      //       // Add any custom options here
      //     });
      //     await TrackPlayer.updateOptions({
      //       capabilities: [
      //         Capability.Play,
      //         Capability.Pause,
      //         Capability.SkipToNext,
      //         Capability.SkipToPrevious,
      //         Capability.SeekTo,
      //       ],
      //       compactCapabilities: [Capability.Play, Capability.Pause],
      //     });
      //   } catch (error) {
      //     console.error("Error setting up TrackPlayer:", error);
      //   }
    };

    setupPlayer();

    // Cleanup on unmount
    return () => {
      //   TrackPlayer.destroy();
    };
  }, []);

  const playSpotifyTrack = async () => {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spotify Full Track Player</Text>
      <Button title="Play Track" onPress={() => playSpotifyTrack()} />
    </View>
  );
};

export default SetupFullTrackPlayback;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
