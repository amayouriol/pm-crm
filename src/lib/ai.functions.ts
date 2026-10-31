import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { requireTeamGate } from "./gate.middleware";

export const summarizeApplicant = createServerFn({ method: "POST" })
  .middleware([requireTeamGate])
  .inputValidator((d: unknown) => {
    const obj = d as { profile?: string };
    if (!obj?.profile || typeof obj.profile !== "string") throw new Error("profile requerido");
    return { profile: obj.profile.slice(0, 12000) };
  })
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY no configurada");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const result = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      messages: [
        {
          role: "system",
          content:
            "Eres una analista senior del programa Women in Finance. Recibes las respuestas de una postulante al programa de mentoría. Genera un RESUMEN EJECUTIVO en español de máximo 180 palabras, con estas secciones cortas en Markdown: **Perfil**, **Fortalezas**, **Riesgos / dudas**, **Recomendación** (una línea). Sé directa, específica y basada solo en el texto proporcionado. No inventes datos.",
        },
        { role: "user", content: data.profile },
      ],
    });
    return { summary: result.text };
  });
