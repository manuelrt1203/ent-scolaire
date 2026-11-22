import type { ReactNode } from "react";
import { EntBrand } from "./EntBrand";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="accueil-banniere flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="mb-6"><EntBrand /></div>
      {children}
    </main>
  );
}
