import { Buffer } from "node:buffer";

const DRIVE_GATEWAY = "https://connector-gateway.lovable.dev/google_drive/v3";
const MAX_CV_BYTES = 15 * 1024 * 1024;

function driveHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const driveKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY no está configurada");
  if (!driveKey) {
    throw new Error(
      "La conexión de Google Drive no está disponible para el servidor. Verifica que esté vinculada al proyecto en Lovable.",
    );
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": driveKey,
    "Content-Type": "application/json",
  };
}

function driveFileId(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("El enlace guardado para el CV no es válido.");
  }

  if (url.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(url.hostname)) {
    throw new Error("El CV debe estar almacenado en Google Drive.");
  }

  const id = url.searchParams.get("id") ?? url.pathname.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1];
  if (!id || !/^[A-Za-z0-9_-]{10,200}$/.test(id)) {
    throw new Error("No se pudo identificar el archivo de CV en Drive.");
  }
  return id;
}

function driveRequestError(status: number, action: "consultar el archivo" | "descargar su contenido"): Error {
  if (status === 401 || status === 403) {
    return new Error("Google Drive no permitió leer este CV. Confirma que la cuenta conectada tenga acceso de lector al archivo o a su carpeta.");
  }
  if (status === 404 && action === "consultar el archivo") {
    return new Error("Drive no encontró el archivo indicado por el enlace del CV. Revisa que el enlace siga vigente y que la cuenta conectada pueda ver la carpeta de archivos del formulario.");
  }
  if (status === 404) {
    return new Error("Drive encontró el CV, pero el conector no pudo descargar su contenido. Verifica la conexión Google Drive del proyecto.");
  }
  return new Error(`No se pudo ${action} en Google Drive (error ${status}).`);
}

/** Downloads one private applicant PDF through the Lovable Google Drive connector. */
export async function downloadApplicantCv(value: string): Promise<Uint8Array> {
  const id = driveFileId(value);
  const headers = driveHeaders();
  const metadataUrl = `${DRIVE_GATEWAY}/files/${encodeURIComponent(id)}?supportsAllDrives=true&fields=mimeType%2Csize`;
  const metadataResponse = await fetch(metadataUrl, { headers });
  if (!metadataResponse.ok) throw driveRequestError(metadataResponse.status, "consultar el archivo");

  const metadata = (await metadataResponse.json()) as { mimeType?: string; size?: string };
  if (metadata.mimeType !== "application/pdf") {
    throw new Error("El archivo de CV no es un PDF.");
  }
  const declaredSize = Number(metadata.size);
  if (!Number.isFinite(declaredSize) || declaredSize <= 0) {
    throw new Error("Google Drive no devolvió un tamaño de archivo válido para el CV.");
  }
  if (declaredSize > MAX_CV_BYTES) {
    throw new Error("El PDF del CV supera el límite de 15 MB para el resumen.");
  }

  const fileResponse = await fetch(
    `${DRIVE_GATEWAY}/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`,
    { headers: { ...headers, Accept: "application/pdf" } },
  );
  if (!fileResponse.ok) throw driveRequestError(fileResponse.status, "descargar su contenido");

  const bytes = Buffer.from(await fileResponse.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_CV_BYTES) {
    throw new Error("El PDF del CV está vacío o supera el límite de 15 MB.");
  }
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Google Drive no devolvió un PDF válido para este CV.");
  }

  return bytes;
}
