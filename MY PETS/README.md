# IELTS GOGOGO

A local IELTS study quest demo. No backend, no login, and no database. Daily progress and task order are saved in browser `localStorage`.

## PWA Status

This project is now a Progressive Web App (PWA), not a native Electron/Tauri desktop app.

What that means:

- It can be installed from Chrome, Edge, and supported Safari versions.
- It opens like a lightweight standalone app window when installed.
- It still runs as pure frontend HTML/CSS/JS.
- Data is saved only in the current browser through `localStorage`.
- If you clear browser data, switch browsers, or use another device, the records do not automatically follow you.
- It cannot currently behave like a true desktop pet with always-on-top floating mode, transparent window, system tray behavior, or native desktop controls.

PWA files:

- `manifest.json`
- `service-worker.js`
- `assets/icons/icon.svg`
- `assets/icons/icon-192.png`
- `assets/icons/icon-512.png`

The service worker caches the basic static files so the app can reopen more reliably after installation. If you replace assets and do not see the update, refresh once or clear the site storage/cache.

## GitHub Pages

This app is designed to work on GitHub Pages as a static site.

Use the repo root as the published directory, or make sure these files remain together:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `assets/`

GitHub Pages serves over HTTPS, which is required for installable PWAs outside `localhost`.

## Installing The PWA

Chrome:

1. Open the deployed page.
2. Click the install icon in the address bar, or open the three-dot menu.
3. Choose `Install IELTS GOGOGO`.
4. Launch it from the desktop, Dock, Launchpad, Start menu, or app launcher.

Edge:

1. Open the deployed page.
2. Click the app/install icon in the address bar, or open the three-dot menu.
3. Choose `Apps` then `Install this site as an app`.
4. Launch it like a normal installed app.

Safari:

1. Open the deployed page.
2. On macOS, use `File` then `Add to Dock` if available.
3. On iPhone/iPad, use Share then `Add to Home Screen`.

Safari support varies by OS version, so Chrome or Edge is usually the most predictable desktop install path.

## Replacing Sounds

Sound files live in `assets/sounds/`.

To replace a sound, overwrite the matching file with a real MP3 using the same filename:

- `assets/sounds/ready-check.mp3`
- `assets/sounds/start.mp3`
- `assets/sounds/clear.mp3`
- `assets/sounds/combo.mp3`
- `assets/sounds/victory.mp3`

The existing files are placeholders. Once replaced, the app will play them automatically. The homepage Sound On / Off toggle controls all sounds.

## Replacing Animations

Animation placeholders live in `assets/animations/`.

For the simplest replacement path, add GIF files with these names:

- `assets/animations/clear.gif`
- `assets/animations/flower.gif`
- `assets/animations/coin.gif`
- `assets/animations/victory.gif`

The app will try to load `clear.gif` for task CLEAR overlays and `victory.gif` for the final victory overlay. If a GIF is missing, it falls back to temporary CSS effects.

The `.json` files are placeholders for future Lottie support. Lottie is not currently included. If you want Lottie, add a library such as `lottie-web` and wire the JSON files into `playAssetAnimation()` in `app.js`.
