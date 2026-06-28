import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from "@expo-google-fonts/archivo";
import {
  SpaceMono_700Bold,
} from "@expo-google-fonts/space-mono";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/authContext";
import { ThemeProvider, useTheme } from "@/lib/themeContext";
import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const { theme } = useTheme();
  const bg = theme === "dark" ? colors.dark.background : colors.light.background;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#C6FF3A" size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  const { theme } = useTheme();
  const C = theme === "dark" ? colors.dark : colors.light;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/signup" />
      <Stack.Screen name="pricing" options={{ presentation: "modal" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="analysis/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: C.background },
          headerTintColor: C.textPrimary,
          headerTitle: "Analysis",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="analysis/skeleton/[id]"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <AuthGate>
                    <RootLayoutNav />
                  </AuthGate>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
