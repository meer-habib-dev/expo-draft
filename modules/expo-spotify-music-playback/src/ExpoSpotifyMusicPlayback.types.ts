// import type { StyleProp, ViewStyle } from "react-native";

// export type OnLoadEventPayload = {
//   url: string;
// };

export type ExpoSpotifyMusicPlaybackModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

// export type ExpoSpotifyMusicPlaybackViewProps = {
//   url: string;
//   onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
//   style?: StyleProp<ViewStyle>;
// };
