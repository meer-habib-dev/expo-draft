import { NativeModule, requireNativeModule } from "expo";

import { ExpoSpotifyMusicPlaybackModuleEvents } from "./ExpoSpotifyMusicPlayback.types";

declare class ExpoSpotifyMusicPlaybackModule extends NativeModule<ExpoSpotifyMusicPlaybackModuleEvents> {
  initialize(): void;
  setAccessToken(token: string): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoSpotifyMusicPlaybackModule>(
  "ExpoSpotifyMusicPlayback"
);
