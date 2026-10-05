# Nordi Mobile

## Requirements

This app uses Expo SDK 52. Use Node.js 20 for the Expo CLI.

`expo-web-browser` is a runtime library, not a config plugin. Keep it out of
`app.json`'s `plugins` list; registering it there can cause prebuild to fail
with `ERR_UNKNOWN_FILE_EXTENSION` from `expo-modules-core`.

On Windows with nvm-windows, switch to Node 20 before installing or starting:

```powershell
nvm install 20
nvm use 20
node --version
```

Run the commands below from the monorepo root:

```powershell
npm install
npm run dev:mobile
```

## API configuration

The mobile app selects a backend URL in `src/core/config/config.ts` and passes
it to the shared API client during mobile bootstrap.

- Set `EXPO_PUBLIC_API_URL` to override the URL (for example, for a deployed
  backend).
- Android emulators use `10.0.2.2` to reach the development machine.
- iOS simulators and physical development devices use the Expo dev-server host.
- Release builds fall back to the configured production API URL.
