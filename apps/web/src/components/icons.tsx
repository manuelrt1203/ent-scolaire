import type { JSX, SVGProps } from "react";

/** Set d'icônes ligne minimalistes (24x24, stroke=currentColor) — évite une
 * dépendance externe (lucide/heroicons) pour un budget de bundle et une
 * surface de dépendances aussi réduits que le reste du projet. */
type IconProps = SVGProps<SVGSVGElement>;
export type IconComponent = (props: IconProps) => JSX.Element;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconGraduationCap(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z" />
      <path d="M6 11.5V17c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-5.5" />
      <path d="M21 9.5v5" />
    </svg>
  );
}

export function IconBookOpen(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.5c-1.5-1.2-3.6-1.8-6-1.8v13c2.4 0 4.5.6 6 1.8 1.5-1.2 3.6-1.8 6-1.8v-13c-2.4 0-4.5.6-6 1.8Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

export function IconClipboard(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V3.75A1.25 1.25 0 0 1 10.25 2.5h3.5A1.25 1.25 0 0 1 15 3.75V4.5" />
      <path d="M8.5 11h7M8.5 15h7" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 5 5.5v5.6c0 4.4 3 7.9 7 9.4 4-1.5 7-5 7-9.4V5.5L12 3Z" />
      <path d="M9.5 12.2 11.3 14l3.2-3.6" />
    </svg>
  );
}

export function IconMegaphone(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10.5v3a1.5 1.5 0 0 0 1.5 1.5H6l1 4h2l-.8-4h1.6l7.2 3V6.5l-7.2 3H4.5A1.5 1.5 0 0 0 3 10.5Z" />
      <path d="M18.5 9.2a3.6 3.6 0 0 1 0 5.6" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.3.9a7.7 7.7 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.7 7.7 0 0 0-1.7 1l-2.3-.9-2 3.4L6.6 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9c.5.4 1.1.75 1.7 1l.4 2.5h4l.4-2.5c.6-.25 1.2-.6 1.7-1l2.3.9 2-3.4-2-1.5Z" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5.5h4V20h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}

export function IconLogOut(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6.5" />
      <path d="M16 15.5 20 12l-4-3.5" />
      <path d="M20 12H9" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconBell(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** Icône par défaut si une catégorie inconnue apparaît un jour. */
export function IconFolder(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l2 2.5h7A1.5 1.5 0 0 1 20 9v8.5A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Z" />
    </svg>
  );
}
