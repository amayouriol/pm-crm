export function validateLinkedInInput(input: unknown) {
  if (!input || typeof input !== "object" || !("text" in input) || typeof input.text !== "string" || !input.text.trim()) {
    throw new Error("Pega el texto del perfil de LinkedIn.");
  }
  if (input.text.length > 20000) throw new Error("El texto supera los 20.000 caracteres. Reduce el contenido antes de resumir.");
  if (/^https?:\/\/\S+$/i.test(input.text.trim())) throw new Error("Pega el contenido del perfil, no solo su enlace.");
  return { text: input.text.trim() };
}