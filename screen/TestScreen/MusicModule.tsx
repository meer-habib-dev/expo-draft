import ExpoSpotifyMusic from "@/modules/expo-spotify-music/src/ExpoSpotifyMusicModule";
import React, { useEffect } from "react";
import { View, Button } from "react-native";

const MusicModule: React.FC = () => {
  //   useEffect(() => {
  //     // Set up event listener
  //     const subscription = ExpoSpotifyMusic.addListener(
  //       "onPlayerStateChanged",
  //       (state) => {
  //         console.log("Spotify State Changed:", state);
  //       }
  //     );

  //     // Clean up subscription
  //     return () => subscription.remove();
  //   }, []);

  //   const handleAuthorize = async () => {
  //     try {
  //       await ExpoSpotifyMusic.authorize(
  //         "713a411c7bd3451a94bac349f0b234a8",
  //         "spotify-ios-quick-start://spotify-login-callback"
  //       );
  //     } catch (error) {
  //       console.error("Authorization failed", error);
  //     }
  //   };

  //   const handlePlayTrack = async () => {
  //     try {
  //       await ExpoSpotifyMusic.playTrack("spotify:track:your_track_id");
  //     } catch (error) {
  //       console.error("Play track failed", error);
  //     }
  //   };

  const handleInitialize = async () => {
    await ExpoSpotifyMusic.initialize(
      "BQBHqSFPcqZZUp6ng1TDLPOIHDRIfXdZNu4zQmp7pIft6YKUYGGOIzZMTX1SAHfECsbI_Yr1UL4SWW3DKOBpKjCB0etHwxG5AnRaxcFhCVkLqCmeh1WUnYYZrdd3ozhyIU1lA1oGIBd2"
    );
    await ExpoSpotifyMusic.connect();
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Authorize Spotify" onPress={handleInitialize} />
      <Button title="Play Track" onPress={() => ExpoSpotifyMusic.connect()} />
    </View>
  );
};

export default MusicModule;
