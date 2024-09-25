import express from 'express';
import multer from 'multer';
import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { analyzeResumeStructure } from './resumeParser.js';

import cors from 'cors';
import busboy from 'busboy';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import natural from 'natural';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import pkg from 'docx';
const { Document, Paragraph, TextRun, Packer } = pkg;

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

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

//Resume upload route
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


// Job description structuring route
app.post('/api/structure-job-description', async (req, res) => {
  console.log('Received request body:', req.body);  // Add this line for debugging
  
  if (!req.body || !req.body.description) {
    return res.status(400).json({ error: 'Invalid request body. Description is required.' });
  }
  
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Job description is required' });
  }

  try {
    console.log('Received job description:', description);

    const prompt = `
      Convert the following unstructured job description into a professional, well-articulated
      resume section.
      Use the exact format shown in the example below:
      Example:
      Christies People (Labourer)
      NOV 2023 - JUN 2024, Sydney
      • Operated power tools safely and effectively to complete tasks in a timely manner.
      • Assisted tradespeople as required, ensuring smooth project flow.
      • Managed site opening and closing, ensuring all protocols were followed.
      • Controlled site traffic when necessary, maintaining safe access and flow.
      Rules:
      1. Use the exact format shown above.
      2. Start each bullet point with a strong action verb in past tense.
      3. Focus on specific achievements, impacts, and quantifiable results where possible.
      4. Use professional language suitable for a construction industry resume.
      5. Limit to 4-5 bullet points maximum.
      6. Ensure all information is accurate based on the input provided.
      Unstructured Input: ${description}
    `;

    console.log('Sending prompt to OpenAI:', prompt);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    console.log('Received response from OpenAI:', response.choices[0].message.content);

    let structuredText = response.choices[0].message.content.trim();
    structuredText = structuredText.replace(/•/g, '- ');
    structuredText = structuredText.replace(/(\d{4}) - (\d{4})/g, '$1-$2');
    structuredText = structuredText.replace(/- (.+?)(?=\n|$)/g, (match, p1) => {
      return `- ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'}`;
    });

    console.log('Sending structured text back to client:', structuredText);

    res.json({ structuredText });
  } catch (error) {
    console.error('Detailed error:', error);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to process job description', 
      details: error.message,
      openaiError: error.response ? error.response.data : null
    });
  }
});

//Resume parsing route
const upload = multer({ dest: 'uploads/' });

app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    let text;

    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({path: file.path});
      text = result.value;
    } else {
      throw new Error('Unsupported file type');
    }

    // Remove the temporary file
    fs.unlinkSync(file.path);

    res.json({ text });
  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

//Resume parsing and analysis route
app.post('/api/parse-and-analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    let text;

    // Parse the file (reuse the parsing logic from step 1)
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({path: file.path});
      text = result.value;
    } else {
      throw new Error('Unsupported file type');
    }

    // Analyze the structure
    const structure = analyzeResumeStructure(text);

    // Remove the temporary file
    fs.unlinkSync(file.path);

    res.json({ structure });
  } catch (error) {
    console.error('Error parsing and analyzing resume:', error);
    res.status(500).json({ error: 'Failed to parse and analyze resume' });
  }
});

//Resume update route
app.post('/api/update-resume', upload.single('resume'), async (req, res) => {
  try {
    const { structuredJobDetails } = req.body;
    const file = req.file;

    if (!file || !structuredJobDetails) {
      return res.status(400).json({ error: 'Resume file and structured job details are required' });
    }

    let updatedResumePath;
    if (file.mimetype === 'application/pdf') {
      updatedResumePath = await updatePDFResume(file.path, structuredJobDetails);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      updatedResumePath = await updateDOCXResume(file.path, structuredJobDetails);
    } else {
      throw new Error('Unsupported file type');
    }

    // Remove the temporary uploaded file
    fs.unlinkSync(file.path);

    res.json({ message: 'Resume updated successfully', updatedResumePath });
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

async function updatePDFResume(filePath, structuredJobDetails) {
  const pdf = await PDFDocument.load(await fs.promises.readFile(filePath));
  const pages = pdf.getPages();
  const firstPage = pages[0];

  const { width, height } = firstPage.getSize();
  const fontSize = 10;
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const existingContent = await extractTextFromPDF(filePath);
  const updatedContent = insertJobDetails(existingContent, structuredJobDetails);

  firstPage.drawText(updatedContent, {
    x: 50,
    y: height - 50,
    size: fontSize,
    font: font,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdf.save();
  const updatedFilePath = `${filePath}_updated.pdf`;
  await fs.promises.writeFile(updatedFilePath, pdfBytes);

  return updatedFilePath;
}

async function updateDOCXResume(filePath, structuredJobDetails) {
  const content = await mammoth.extractRawText({ path: filePath });
  const existingText = content.value;

  const updatedContent = insertJobDetails(existingText, structuredJobDetails);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun(updatedContent)],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const updatedFilePath = `${filePath}_updated.docx`;
  await fs.promises.writeFile(updatedFilePath, buffer);

  return updatedFilePath;
}

function insertJobDetails(existingContent, structuredJobDetails) {
  const lines = existingContent.split('\n');
  let experienceIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('experience') || lines[i].toLowerCase().includes('work experience')) {
      experienceIndex = i;
      break;
    }
  }

  if (experienceIndex !== -1) {
    lines.splice(experienceIndex + 1, 0, structuredJobDetails);
  } else {
    lines.push('Experience', structuredJobDetails);
  }

  return lines.join('\n');
}

async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF');
  }
}

//Server is running on port 5001
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message 
  });
});

export default app;