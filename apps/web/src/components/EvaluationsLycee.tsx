import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateEvaluationsLycee, useAuth, type EvaluationsLycee as Valeurs, type Note } from "@ent/shared";
import { Button } from "./ui/Button";
import { Field, Input } from "./ui/Field";

const champs = [
  ["devoir_1", "Devoir 1"],
  ["devoir_2", "Devoir 2"],
  ["devoir_departemental", "Devoir départemental"],
  ["composition", "Composition"],
] as const;

export function aDesEvaluationsLycee(note: Note) {
  return champs.some(([champ]) => note[champ] != null);
}

export function EvaluationsLycee({ note, editable, disabled, complete = false }: { note: Note; editable: boolean; disabled: boolean; complete?: boolean }) {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  const [saisie, setSaisie] = useState<Valeurs>({
    devoir_1: note.devoir_1 ?? null,
    devoir_2: note.devoir_2 ?? null,
    devoir_departemental: note.devoir_departemental ?? null,
    composition: note.composition ?? null,
  });
  const modifiee = champs.some(([champ]) => saisie[champ] !== (note[champ] ?? null));
  const enregistrer = useMutation({
    mutationKey: ["evaluations-lycee", note.releve_id],
    mutationFn: () => updateEvaluationsLycee(client, note.id, saisie, note.updated_at),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes", note.releve_id] }),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editable && modifiee && !disabled && !enregistrer.isPending) enregistrer.mutate();
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid min-w-56 grid-cols-2 gap-2 sm:grid-cols-4">
        {champs.map(([champ, libelle]) => (
          <Field key={champ} label={libelle}>
            <Input type="number" min={0} max={20} step={0.01} required={complete} value={saisie[champ] ?? ""}
              disabled={!editable || disabled || enregistrer.isPending}
              onChange={(event) => {
                const valeur = event.target.valueAsNumber;
                setSaisie((courante) => ({ ...courante, [champ]: Number.isNaN(valeur) ? null : valeur }));
              }}
            />
          </Field>
        ))}
      </div>
      {editable && modifiee && (
        <Button type="submit" disabled={disabled || enregistrer.isPending}>Enregistrer les évaluations</Button>
      )}
      {enregistrer.error && (
        <p role="alert" className="text-xs text-red-700">{enregistrer.error.message}</p>
      )}
    </form>
  );
}
