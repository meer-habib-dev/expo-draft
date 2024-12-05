import { StyleSheet, Text, View } from "react-native";
import React from "react";

import SpotifyPlayer from "./SpotifyPlayerHidden";
import SpotifyMusicPlayer from "./spotify-music-web";
import SetupFullTrackPlayback from "./SetupFullTrackPlayback";
import SimpleApi from "./SimpleApi";
import MusicModule from "./MusicModule";
import ExpoSpotify from "../ExpoSpotify";
import ExpoSpotifyCore from "../ExpoSpotifyCore";
import SessionPlay from "./SessionPlay";
import WebSessionChat from "../new/WebSessionChat";

const index = () => {
  const accessToken =
    "BQDbZNXEQ0Hxe3JO9oPh-LS0dbcWb3gR3HJMYiCl1I6_NxbzgPhw13SQdoPDpDLhEhqEzwOuCD-N5_F6a5Z58X--NXkXbvsVggfAIIUPRUEWA-IBNDpbtlzxc5y03P3N3etJrVWJywHUbuxh01pu2GcPs1WAV4fMc42-4Y-AkinoO2EQsJFBdxgh0MFVWr-nf9qklYAlGouNQDNc00fQyO_M6gxo0wxjw0NZP1So";
  const trackUri = "spotify:track:5zCnGtCl5Ac5zlFHXaZmhy";
  // return <SimpleApi accessToken={accessToken} trackUri={trackUri} />;
  // return (
  //   <SetupFullTrackPlayback accessToken={accessToken} trackId={trackUri} />
  // );
  // return <SpotifyMusicPlayer />;
  // return <ExpoSpotify />;
  // return <ExpoSpotifyCore />;
  return <WebSessionChat />;
};

export default index;

const styles = StyleSheet.create({});
