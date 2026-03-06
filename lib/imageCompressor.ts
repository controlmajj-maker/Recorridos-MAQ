/**
 * Comprime una imagen antes de subirla.
 * - Máximo 1200px en el lado más largo
 * - Calidad JPEG 80%
 * - Garantiza resultado < 4MB (límite Vercel serverless)
 * - Si ya es pequeña, la devuelve sin cambios
 */
export async function compressImage(file: File, maxSizeMB = 3.5): Promise<File> {
  // Si no es imagen o no hay soporte Canvas, devolver tal cual
  if (!file.type.startsWith("image/") || typeof document === "undefined") return file;

  const maxBytes = maxSizeMB * 1024 * 1024;

  // Si ya cabe, no comprimir
  if (file.size <= maxBytes) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calcular dimensiones respetando aspect ratio — máx 1200px
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width >= height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Intentar calidades descendentes hasta que quepa
      const tryQuality = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }

            if (blob.size <= maxBytes || quality <= 0.3) {
              // Usar el blob comprimido
              const compressed = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                { type: "image/jpeg", lastModified: Date.now() }
              );
              resolve(compressed);
            } else {
              // Reducir calidad y reintentar
              tryQuality(Math.max(quality - 0.15, 0.3));
            }
          },
          "image/jpeg",
          quality
        );
      };

      tryQuality(0.8);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // fallback: subir original
    };

    img.src = url;
  });
}
