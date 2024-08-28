require('dotenv').config();

import express, { json } from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set up multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  },
});

app.post('/api/upload-resume', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // File uploaded successfully
  res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

app.post('/api/structure-job-description', async (req, res) => {
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
    // Post-processing
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});