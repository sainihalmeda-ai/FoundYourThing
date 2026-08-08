# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Every screen must work on every device

The app runs in Expo Go on Android and iOS, and in a browser on phones and
laptops. A control that only works on one of them is a bug, not a limitation.

- Guard camera-only APIs with `Platform.OS !== "web"`. A desktop browser has no
  camera app, and a phone browser already offers the camera inside its file
  dialog, so the web needs one "Choose photo" button rather than a Camera button
  that silently opens a file dialog.
- Make the whole drop area pressable, not just the button beside it. People tap
  the empty box first.
- Give images explicit heights. A percentage height collapses to zero on the web
  when the parent is a centred flex container.
- Check every new screen at a narrow phone width and a wide desktop width.
- Any scroll container holding a text field needs
  `keyboardShouldPersistTaps="handled"`. The default swallows the first tap
  while the keyboard is open, so on a phone the next field simply never
  focuses even though the ripple animates.
- Forms scroll with `KeyboardAwareScrollView` from
  `src/components/Keyboard.tsx` (Expo Go–safe wrapper). On Android the
  keyboard covers the lower half of the screen and a plain scroll view leaves
  the focused field behind it, so people type blind. Do not import
  `react-native-keyboard-controller` directly — it crashes Expo Go.
- Send photos through `compressForUpload` before uploading. A raw camera file is
  3-5 MB and takes long enough on campus Wi-Fi to look like a dead server.

# Metro does not see file changes

The project lives under OneDrive, where Metro's Windows file watcher misses
change events. After editing source, restart the dev server
(`npx expo start --clear`) instead of trusting hot reload.
