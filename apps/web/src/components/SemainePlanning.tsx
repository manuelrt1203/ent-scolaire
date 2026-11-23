import { dateHeureSaisieCalendrier, lundiDuCreneau, useAuth, useEtablissementCalendrier } from "@ent/shared";
import { useSearchParams } from "react-router-dom";
import { Field, Input } from "./ui/Field";

export function useSemainePlanning() {
  const { client, profile } = useAuth();
  const { pays, fuseau } = useEtablissementCalendrier(client, profile);
  const [params] = useSearchParams();
  const aujourdHui = dateHeureSaisieCalendrier(new Date(), pays, fuseau?.identifiant).slice(0, 10);
  return lundiDuCreneau(params.get("semaine") ?? "") ?? lundiDuCreneau(aujourdHui)!;
}

export function SemainePlanning({ lundi }: { lundi: string }) {
  const [params, setParams] = useSearchParams();
  return (
    <div className="mb-4 max-w-xs">
      <Field label="Semaine du">
        <Input type="date" aria-label="Semaine affichée" value={lundi} onChange={(event) => {
          const semaine = lundiDuCreneau(event.target.value);
          if (!semaine) return;
          const suivants = new URLSearchParams(params);
          suivants.set("semaine", semaine);
          suivants.delete("appel");
          setParams(suivants);
        }} />
      </Field>
    </div>
  );
}
