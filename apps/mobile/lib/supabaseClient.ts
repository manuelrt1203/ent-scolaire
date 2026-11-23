// Polyfills requis par supabase-js en environnement React Native — doivent
// être importés avant tout le reste (crypto.getRandomValues et l'API URL
// n'existent pas nativement dans Hermes).
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@ent/shared";

export const supabase = createClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  storage: AsyncStorage,
  persistSession: process.env.EXPO_PUBLIC_ENT_TEST_PIXEL !== "1",
});
