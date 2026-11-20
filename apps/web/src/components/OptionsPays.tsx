import { REGLAGES_PAYS } from "@ent/shared";

const regions = new Map<string, { code: string; nom: string }[]>();

for (const [code, { region, nom }] of Object.entries(REGLAGES_PAYS)) {
  const pays = regions.get(region) ?? [];
  pays.push({ code, nom });
  regions.set(region, pays);
}

const tri = new Intl.Collator("fr");

export function OptionsPays() {
  return (
    <>
      {[...regions].sort(([a], [b]) => tri.compare(a, b)).map(([region, pays]) => (
        <optgroup key={region} label={region}>
          {[...pays].sort((a, b) => tri.compare(a.nom, b.nom)).map(({ code, nom }) => <option key={code} value={code}>{nom}</option>)}
        </optgroup>
      ))}
    </>
  );
}
