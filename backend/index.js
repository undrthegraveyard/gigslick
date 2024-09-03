import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import busboy from 'busboy';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Configure CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
    console.log(`Created uploads directory: ${uploadsDir}`);
}

// Handle resume upload
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

    writeStream.on('finish', () => {
      console.log(`File saved successfully to ${saveTo}`);
    });

    writeStream.on('error', (error) => {
      console.error(`Error saving file: ${error}`);
    });
  });

  bb.on('finish', () => {
    console.log("Busboy finished processing the request");
    if (fileReceived) {
      if (saveToPath) {
        console.log(`File should be saved at: ${saveToPath}`);
        fs.access(saveToPath, fs.constants.F_OK, (err) => {
          if (err) {
            console.error(`File does not exist at ${saveToPath}`);
            res.status(500).json({ error: 'File was not saved properly' });
          } else {
            console.log(`File exists at ${saveToPath}`);
            res.json({ 
              message: 'File uploaded successfully',
              path: saveToPath
            });
          }
        });
      } else {
        console.error('File was processed but not saved');
        res.status(500).json({ error: 'File was processed but not saved' });
      }
    } else {
      console.error('No file was processed');
      res.status(400).json({ error: 'No file was processed' });
    }
  });

  bb.on('error', (error) => {
    console.error("Busboy error:", error);
    res.status(500).json({ error: 'File upload failed' });
  });

  req.pipe(bb);
});

// Handle job description structuring
app.post('/api/structure-job-description', async (req, res) => {
  const { description } = req.body;
  if (!description) {
    return res.status(400).json({ error: 'Job description is required' });
  }
  try {
    console.log('Received job description:', description);

    // Construct prompt for OpenAI
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

    // Make API request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    console.log('Received response from OpenAI:', response.choices[0].message.content);

    let structuredText = response.choices[0].message.content.trim();
    // Post-processing of the structured text
    structuredText = structuredText.replace(/•/g, '- '); // Replace bullet points with dashes
    structuredText = structuredText.replace(/(\d{4}) - (\d{4})/g, '$1-$2'); // Ensure consistent date formatting
    // Ensure each bullet point starts with a capital letter and ends with a period
    structuredText = structuredText.replace(/- (.+?)(?=\n|$)/g, (match, p1) => {
      return `- ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'}`;
    });

    console.log('Sending structured text back to client:', structuredText);

    res.json({ structuredText });
  } catch (error) {
    console.error('Error making API request:', error);
    res.status(500).json({ error: 'Failed to process job description', details: error.message });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(error.status || 500).json({ error: error.message });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});