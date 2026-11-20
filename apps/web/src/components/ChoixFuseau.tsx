import { fuseauxCalendrier, type PaysCalendrier } from "@ent/shared";
import { Field, Select } from "./ui/Field";

export function ChoixFuseau({ pays, valeur, onChange }: {
  pays: PaysCalendrier;
  valeur: string;
  onChange: (valeur: string) => void;
}) {
  const fuseaux = fuseauxCalendrier(pays);
  if (fuseaux.length < 2) return null;

  return (
    <Field label="Fuseau horaire de l’établissement">
      <Select required value={valeur} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choisir un fuseau</option>
        {fuseaux.map(({ identifiant, libelle }) => <option key={identifiant} value={identifiant}>{libelle}</option>)}
      </Select>
    </Field>
  );
}
