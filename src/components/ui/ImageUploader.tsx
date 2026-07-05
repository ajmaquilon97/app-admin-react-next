"use client";

import { useRef, useState, useEffect } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

interface ImageUploaderProps {
  value: string;          // URL pública controlada por el padre
  onChange: (url: string) => void;
}

type Status = "idle" | "uploading" | "done" | "error";

export function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");

  // Si el padre ya tiene un URL (p.ej. al volver al paso), mostramos la imagen
  useEffect(() => {
    if (value && !preview) setPreview(value);
  }, [value, preview]);

  const handleFile = async (file: File) => {
    setUploadError("");
    setStatus("uploading");

    // Preview local inmediato
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      // 1. Presigned URL del Route Handler
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo obtener la URL de subida.");
      }

      const { uploadUrl, publicUrl } = (await res.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      // 2. Upload directo al S3 — el servidor Next.js no toca el archivo
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!s3Res.ok) throw new Error("Error al subir la imagen a S3.");

      setStatus("done");
      onChange(publicUrl); // propaga el URL definitivo al padre
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error desconocido.");
      setStatus("error");
      setPreview("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a seleccionar el mismo archivo
    if (file) void handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const handleRemove = () => {
    setStatus("idle");
    setPreview("");
    setUploadError("");
    onChange("");
  };

  const hasImage = !!(preview || value);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {!hasImage ? (
        /* — Zona drop / selector — */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 p-10 flex flex-col items-center justify-center text-center hover:border-secondary hover:bg-secondary/5 transition-colors cursor-pointer group"
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-text-main">Arrastra tu imagen aquí</p>
          <p className="text-xs text-text-muted mt-1 mb-4">JPG, PNG o WEBP · Máx. 5 MB</p>
          <span className="bg-white border border-gray-200 px-5 py-2 rounded-xl text-sm font-medium text-text-main shadow-sm group-hover:text-primary group-hover:border-gray-300 transition-colors flex items-center gap-2">
            <ImagePlus className="w-4 h-4" /> Seleccionar archivo
          </span>
        </div>
      ) : (
        /* — Preview — */
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview || value}
            alt="Imagen de portada"
            className="w-full h-56 object-cover"
          />

          {/* Overlay de carga */}
          {status === "uploading" && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-semibold">Subiendo a S3...</p>
            </div>
          )}

          {/* Badge de éxito */}
          {status === "done" && (
            <div className="absolute top-3 left-3 bg-success text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
              Imagen subida
            </div>
          )}

          {/* Botón eliminar */}
          {status !== "uploading" && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-error rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Cambiar imagen */}
      {hasImage && status !== "uploading" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-secondary hover:underline font-medium"
        >
          Cambiar imagen
        </button>
      )}

      {/* Error */}
      {uploadError && (
        <p className="text-xs text-error font-medium">{uploadError}</p>
      )}
    </div>
  );
}
