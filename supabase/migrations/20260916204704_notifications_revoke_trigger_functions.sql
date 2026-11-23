-- Ces fonctions ne doivent jamais être appelées directement en RPC (seulement
-- par les triggers ci-dessus) ; Postgres refuse déjà l'appel direct d'une
-- fonction de retour "trigger" hors contexte de trigger, mais on retire aussi
-- explicitement le droit d'exécution pour que ce soit sans ambiguïté.
revoke execute on function public.notifier_releve_publie() from public, anon, authenticated;
revoke execute on function public.notifier_actualite() from public, anon, authenticated;
revoke execute on function public.notifier_cahier_texte() from public, anon, authenticated;
revoke execute on function public.notifier_vie_scolaire() from public, anon, authenticated;
