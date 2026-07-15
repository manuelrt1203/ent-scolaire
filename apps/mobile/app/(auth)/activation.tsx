import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth, requestActivationCode, verifyActivationCode, setPassword } from "@ent/shared";

type Step = "email" | "code" | "password";

export default function ActivationScreen() {
  const { client } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestCode() {
    setError(null);
    setLoading(true);
    try {
      await requestActivationCode(client, email);
    } catch {
      // Message volontairement générique : ne pas révéler si l'email existe.
    } finally {
      setLoading(false);
      setInfo("Si un compte existe avec cet email, un code à 6 chiffres vient d'être envoyé.");
      setStep("code");
    }
  }

  async function handleVerifyCode() {
    setError(null);
    setLoading(true);
    try {
      await verifyActivationCode(client, email, code);
      setInfo(null);
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide ou expiré");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetPassword() {
    setError(null);
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await setPassword(client, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de définir le mot de passe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-6">
      <View className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6">
        <Text className="mb-1 text-xl font-semibold text-slate-900">Première connexion</Text>
        <Text className="mb-6 text-sm text-slate-500">
          {step === "email" && "Entrez l'email transmis par votre établissement."}
          {step === "code" && "Entrez le code reçu par email."}
          {step === "password" && "Choisissez votre mot de passe définitif."}
        </Text>

        {info && <Text className="mb-4 text-sm text-slate-600">{info}</Text>}
        {error && <Text className="mb-4 text-sm text-red-600">{error}</Text>}

        {step === "email" && (
          <>
            <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <Pressable onPress={handleRequestCode} disabled={loading} className="rounded-md bg-slate-900 px-3 py-3 disabled:opacity-50">
              <Text className="text-center text-sm font-medium text-white">{loading ? "Envoi…" : "Recevoir mon code"}</Text>
            </Pressable>
          </>
        )}

        {step === "code" && (
          <>
            <Text className="mb-1 text-sm font-medium text-slate-700">Code à 6 chiffres</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest"
            />
            <Pressable onPress={handleVerifyCode} disabled={loading} className="mb-2 rounded-md bg-slate-900 px-3 py-3 disabled:opacity-50">
              <Text className="text-center text-sm font-medium text-white">{loading ? "Vérification…" : "Valider le code"}</Text>
            </Pressable>
            <Pressable onPress={() => setStep("email")}>
              <Text className="text-center text-xs text-slate-500">Renvoyer un code / changer d'email</Text>
            </Pressable>
          </>
        )}

        {step === "password" && (
          <>
            <Text className="mb-1 text-sm font-medium text-slate-700">Nouveau mot de passe</Text>
            <TextInput
              value={password}
              onChangeText={setPasswordValue}
              secureTextEntry
              className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">Confirmer le mot de passe</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              className="mb-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <Pressable onPress={handleSetPassword} disabled={loading} className="rounded-md bg-slate-900 px-3 py-3 disabled:opacity-50">
              <Text className="text-center text-sm font-medium text-white">{loading ? "Enregistrement…" : "Activer mon compte"}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
