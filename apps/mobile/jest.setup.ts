jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@expo-google-fonts/inter/400Regular", () => ({
  Inter_400Regular: 400,
}));

jest.mock("@expo-google-fonts/inter/600SemiBold", () => ({
  Inter_600SemiBold: 600,
}));

jest.mock("expo-font", () => ({
  useFonts: jest.fn(() => [true, null]),
}));
