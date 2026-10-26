import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { ErrorHttp } from '../utils/ErrorHttp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CARPETA_PRODUCTOS = path.resolve(
  __dirname,
  '../../uploads/productos',
);

if (!fs.existsSync(CARPETA_PRODUCTOS)) {
  fs.mkdirSync(CARPETA_PRODUCTOS, { recursive: true });
}

const EXTENSIONES_PERMITIDAS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MIMES_PERMITIDOS = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CARPETA_PRODUCTOS);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const nombreUnico = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    cb(null, nombreUnico);
  },
});

function fileFilter(_req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const esMimeValido = MIMES_PERMITIDOS.has(file.mimetype.toLowerCase());
  const esExtensionValida = EXTENSIONES_PERMITIDAS.has(extension);

  if (!esMimeValido || !esExtensionValida) {
    return cb(
      new ErrorHttp(400, 'Solo se permiten imágenes en formato JPG, PNG o WEBP.'),
    );
  }

  return cb(null, true);
}

export const uploadProducto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
});

export function procesarImagenProducto(campo = 'imagen') {
  const handler = uploadProducto.single(campo);

  return (req, res, next) => {
    handler(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ErrorHttp(400, 'La imagen no puede superar los 3 MB.'),
          );
        }

        return next(
          new ErrorHttp(400, `Error al procesar la imagen: ${error.message}`),
        );
      }

      return next(error);
    });
  };
}

export async function eliminarArchivoUpload(rutaRelativa) {
  if (!rutaRelativa || typeof rutaRelativa !== 'string') {
    return;
  }

  try {
    const rutaNormalizada = rutaRelativa.replace(/^\/?uploads\//, '');
    const rutaAbsoluta = path.resolve(__dirname, '../../uploads', rutaNormalizada);

    if (fs.existsSync(rutaAbsoluta)) {
      await fs.promises.unlink(rutaAbsoluta);
    }
  } catch (error) {
    console.error('No se pudo eliminar el archivo subido:', error.message);
  }
}
