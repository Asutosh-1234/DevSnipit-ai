import { Stack } from "expo-router";
import { ThemeProvider } from "./screens/components";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "./screens/components";

function AppStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusbar} backgroundColor={colors.background} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppStatusBar />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
