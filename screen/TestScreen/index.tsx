import { StyleSheet, Text, View } from "react-native";
import React from "react";

import SpotifyPlayer from "./SpotifyPlayerHidden";
import SpotifyMusicPlayer from "./spotify-music-web";
import SetupFullTrackPlayback from "./SetupFullTrackPlayback";
import SimpleApi from "./SimpleApi";
import MusicModule from "./MusicModule";
import ExpoSpotify from "../ExpoSpotify";

const index = () => {
  const accessToken =
    "BQAX5mL6nvQ5u5oMSmV_4C72egia_QijoCLoWM8N0JISl74fublJ8Wn0F6hIzkAqkJkDwAn5_Xg5WSnrx8FDgBrCmlDOVOZT88BEcOmz5c0WBnlxh-GBT2REu68kqWhwwMTnrH_yMSDFZvRHLpcJa3L7BpravWsN-RUFOw3NtHjZPGBDchH2mtRjemwuY-DSGS2c09FvfbV_4CimQrQ1zn7z1q-0iABdgHfRhwUk";
  const trackUri = "spotify:track:5zCnGtCl5Ac5zlFHXaZmhy";
  // return <SimpleApi accessToken={accessToken} trackUri={trackUri} />;
  // return (
  //   <SetupFullTrackPlayback accessToken={accessToken} trackId={trackUri} />
  // );
  // return <SpotifyMusicPlayer />;
  return <ExpoSpotify />;
};

export default index;

const styles = StyleSheet.create({});
