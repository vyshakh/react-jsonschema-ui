import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';

import { config } from '@/tamagui.config';

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <TamaguiProvider config={config} defaultTheme={scheme}>
      <Theme name={scheme}>
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen
              name="index"
              options={{ title: 'react-jsonschema-ui', headerLargeTitleEnabled: true }}
            />
            <Stack.Screen name="sample/[id]" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </Theme>
    </TamaguiProvider>
  );
}
