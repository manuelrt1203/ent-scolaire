import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline" | "success";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-ent-accent text-white hover:bg-ent-accent/90 focus-visible:outline-ent-accent",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400",
  ghost: "text-slate-500 hover:text-slate-900",
  danger: "text-slate-400 hover:text-red-600",
  "danger-outline": "border border-red-300 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-red-400",
  success: "bg-emerald-600 text-white hover:bg-emerald-600/90 focus-visible:outline-emerald-600",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const sizing = variant === "ghost" || variant === "danger" ? "text-xs" : "px-4 py-2 text-sm";
  return (
    <button
      className={`rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
