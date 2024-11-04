// 1. config/openai.js
import OpenAI from 'openai/index.mjs';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default openai;