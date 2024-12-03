// Reexport the native module. On web, it will be resolved to ExpoSpotifyMusicPlaybackModule.web.ts
// and on native platforms to ExpoSpotifyMusicPlaybackModule.ts
export { default } from './src/ExpoSpotifyMusicPlaybackModule';
export { default as ExpoSpotifyMusicPlaybackView } from './src/ExpoSpotifyMusicPlaybackView';
export * from  './src/ExpoSpotifyMusicPlayback.types';
