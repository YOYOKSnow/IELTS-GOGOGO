# Animation Placeholders

The current app is dependency-free and does not load Lottie by default.

Built-in behavior:

- If `assets/animations/clear.gif` exists, the CLEAR overlay will use it.
- If `assets/animations/victory.gif` exists, the victory overlay will use it.
- If those GIF files are missing, the app uses temporary CSS fallback effects.

The `.json` files in this folder are placeholders for future Lottie files. To use Lottie, add a Lottie player library such as `lottie-web`, then wire these JSON files into `playAssetAnimation()` in `app.js`.

Recommended replacement filenames:

- `clear.gif` or `clear.json`
- `flower.gif` or `flower.json`
- `coin.gif` or `coin.json`
- `victory.gif` or `victory.json`
