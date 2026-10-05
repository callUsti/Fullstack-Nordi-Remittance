module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase)",
  ],
  moduleNameMapper: {
    "^firebase/auth$": "<rootDir>/node_modules/firebase/auth/dist/index.cjs.js",
    "^@firebase/auth$":
      "<rootDir>/node_modules/@firebase/auth/dist/node/index.js",
  },
};