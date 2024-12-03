import { Button, StyleSheet, View } from "react-native";
import React from "react";
import ExpoSpotifyMusicPlaybackModule from "@/modules/expo-spotify-music-playback/src/ExpoSpotifyMusicPlaybackModule";
const accessToken =
  "BQCvAz_RY4oLel0HxaX9SnvZ1kqpNUBiCmRmJJ2dLcmVW86HLDVmSoItwGc3fXzLAHR73Cryf_oIVaOU16NXeoVCkV5ry6pV82BSovT-Q2uKKW9oNWp9XPFMv_BgJ_cEKam_wXLDwRQN3SVWCLrEEw3aJV_qFJRi8sBlKirPR0MhP8IfrSPyCxTGG2uWzHFVVv7yZI5FFaLqf1kndMpmQ3_MDtpaT4HtotF3Vz7w";

const ExpoSpotify = () => {
  const handleInitialize = async () => {
    ExpoSpotifyMusicPlaybackModule.setAccessToken(accessToken);
  };
  const handlePlayTrack = async () => {
    ExpoSpotifyMusicPlaybackModule.playTrack(
      "spotify:track:6eUKZXaKkcviH0Ku9w2n3V"
    );
  };
  const handlePauseTrack = async () => {
    ExpoSpotifyMusicPlaybackModule.pauseTrack();
  };
  const handleResumeTrack = async () => {
    ExpoSpotifyMusicPlaybackModule.resumeTrack();
  };
  const handleGetCurrentTrack = async () => {
    ExpoSpotifyMusicPlaybackModule.getCurrentTrack();
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Initialize" onPress={handleInitialize} />
      <Button title="Play Track" onPress={handlePlayTrack} />
      <Button title="Pause Track" onPress={handlePauseTrack} />
      <Button title="Resume Track" onPress={handleResumeTrack} />
      <Button title="Get Current Track" onPress={handleGetCurrentTrack} />
    </View>
  );
};

export default ExpoSpotify;

const styles = StyleSheet.create({});
