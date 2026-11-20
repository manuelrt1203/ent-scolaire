export async function imprimerBulletin(construireHtml: () => Promise<string>) {
  const fenetre = window.open("", "_blank");
  if (!fenetre) throw new Error("Autorisez les fenêtres surgissantes pour imprimer le bulletin.");
  try {
    const html = await construireHtml();
    fenetre.document.write(html);
    fenetre.document.close();
    fenetre.focus();
    fenetre.print();
  } catch (error) {
    fenetre.close();
    throw error;
  }
}
