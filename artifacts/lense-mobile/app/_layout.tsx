import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/authContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const AUTH_ROUTES = ["/auth/login", "/auth/signup", "/", "/onboarding"];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#6c63ff" size="large" />
      </View>
    );
  }

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith("/auth/"));

  if (!isAuthenticated && !isAuthRoute) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
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
          headerStyle: { backgroundColor: "#0a0a0f" },
          headerTintColor: "#f0f0f8",
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
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
              <KeyboardProvider>
                <AuthGate>
                  <RootLayoutNav />
                </AuthGate>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
