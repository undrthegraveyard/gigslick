import express from 'express';
import cors from 'cors';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
    console.log(`Created uploads directory: ${uploadsDir}`);
}

app.post('/api/upload-resume', (req, res) => {
  console.log("Received request for file upload");
  console.log("Request headers:", req.headers);

  const bb = busboy({ headers: req.headers });
  let saveToPath = '';
  let fileReceived = false;

  bb.on('file', (name, file, info) => {
    fileReceived = true;
    const { filename, encoding, mimeType } = info;
    console.log(`Processing file: [${name}]: filename: ${filename}, encoding: ${encoding}, mimeType: ${mimeType}`);
    
    const saveTo = path.join(uploadsDir, filename);
    saveToPath = saveTo;
    console.log(`Attempting to save file to: ${saveTo}`);

    const writeStream = fs.createWriteStream(saveTo);
    file.pipe(writeStream);

    file.on('data', (data) => {
      console.log(`Received ${data.length} bytes of data.`);
    });

    file.on('end', () => {
      console.log('File upload finished');
      res.json({ 
        message: 'File uploaded successfully',
        path: saveTo
      });
    });

    writeStream.on('error', (error) => {
      console.error(`Error saving file: ${error}`);
      res.status(500).json({ error: 'Error saving file' });
    });
  });

  bb.on('error', (error) => {
    console.error("Busboy error:", error);
    res.status(500).json({ error: 'File upload failed' });
  });

  bb.on('finish', () => {
    console.log("Busboy finished processing the request");
    if (!fileReceived) {
      console.error('No file was processed');
      res.status(400).json({ error: 'No file was processed' });
    }
  });

  req.pipe(bb);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});