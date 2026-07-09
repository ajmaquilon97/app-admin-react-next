import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifySession } from "@/lib/dal";

const BUCKET = process.env.S3_BUCKET_NAME!;
const REGION = process.env.AWS_REGION ?? "us-east-1";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Credenciales resueltas por la cadena por defecto del SDK:
// AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY en local, IAM role del compute en Amplify.
const s3 = new S3Client({ region: REGION });

/**
 * POST /api/upload/presign
 * Body: { fileName: string; contentType: string; fileSize: number }
 * Returns: { uploadUrl: string; publicUrl: string }
 *
 * El cliente sube el archivo directamente a S3 con PUT al uploadUrl.
 * El publicUrl se guarda en el formulario como imagenPortada.
 */
export async function POST(request: NextRequest) {
  // Solo usuarios autenticados pueden subir
  try {
    await verifySession();
  } catch {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    fileName?: string;
    contentType?: string;
    fileSize?: number;
  };

  const { fileName, contentType, fileSize } = body;

  if (!fileName || !contentType || !fileSize) {
    return NextResponse.json({ error: "Faltan parámetros." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa JPG, PNG o WEBP." },
      { status: 400 }
    );
  }
  if (fileSize > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 5 MB." },
      { status: 400 }
    );
  }
  if (!BUCKET) {
    return NextResponse.json(
      { error: "S3_BUCKET_NAME no está configurado." },
      { status: 500 }
    );
  }

  // Nombre único para evitar colisiones
  const ext = fileName.split(".").pop() ?? "jpg";
  const key = `espacios/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl });
}
