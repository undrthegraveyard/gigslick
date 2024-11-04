// 2. middleware/upload.js
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');

const uploadMiddleware = (req, res, next) => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  const bb = busboy({ headers: req.headers });
  let saveToPath = '';
  let fileReceived = false;

  bb.on('file', (name, file, info) => {
    fileReceived = true;
    const { filename, mimeType } = info;

    if (!mimeType.includes('openxmlformats-officedocument.wordprocessingml.document')) {
      return next(new Error('Invalid file type. Only DOCX files are allowed.'));
    }

    const saveTo = path.join(uploadsDir, filename);
    saveToPath = saveTo;

    const writeStream = fs.createWriteStream(saveTo);
    file.pipe(writeStream);

    writeStream.on('finish', () => {
      req.file = {
        path: saveTo,
        filename: filename
      };
      next();
    });

    writeStream.on('error', next);
  });

  bb.on('error', next);
  bb.on('finish', () => {
    if (!fileReceived) {
      next(new Error('No file was received'));
    }
  });

  req.pipe(bb);
};

export default uploadMiddleware;