# Nordi Mobile

## Requirements

This app uses Expo SDK 54 and React Native 0.81. Use Node.js 22.23.3 or newer;
the frontend workspace pins 22.23.3 in `.nvmrc`.

On Windows with nvm-windows, switch to the pinned Node version before installing
or starting:

```powershell
nvm install 22.23.3
nvm use 22.23.3
node --version
```

Run commands from the frontend monorepo root:

```powershell
npm install
npm run dev:mobile
```

The mobile Babel preset is declared directly by the app because Babel resolves
presets from the project workspace, not from Expo's nested dependencies.

## API configuration

The mobile app selects a backend URL in `apps/mobile/src/core/config/config.ts`
and passes it to the shared API client during mobile bootstrap.

- Set `EXPO_PUBLIC_API_URL` to override the URL (for example, for a deployed
  backend).
- Android emulators use `10.0.2.2` to reach the development machine.
- iOS simulators and physical development devices use the Expo dev-server host.
- Release builds fall back to the configured production API URL.
