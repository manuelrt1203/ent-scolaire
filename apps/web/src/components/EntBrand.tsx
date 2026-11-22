import { Link } from "react-router-dom";
import { IconGraduationCap } from "./icons";

export function EntBrand({ homePath = "/" }: { homePath?: string }) {
  return (
    <Link
      to={homePath}
      className="inline-flex shrink-0 items-center gap-3 rounded-xl font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-teal-300 text-midnight-ink">
        <IconGraduationCap className="size-6" aria-hidden="true" />
      </span>
      <span className={homePath === "/" ? undefined : "sr-only sm:not-sr-only"}>ENT Scolaire</span>
    </Link>
  );
}
