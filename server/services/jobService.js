// 5. services/jobService.js
import openai from '../config/openai.js';

class JobService {
  async structureJobDescription(description) {
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

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    let structuredText = response.choices[0].message.content.trim();
    structuredText = this.formatStructuredText(structuredText);
    
    return structuredText;
  }

  formatStructuredText(text) {
    return text
      .replace(/•/g, '- ')
      .replace(/(\d{4}) - (\d{4})/g, '$1-$2')
      .replace(/- (.+?)(?=\n|$)/g, (match, p1) => {
        return `- ${p1.charAt(0).toUpperCase() + p1.slice(1)}${p1.endsWith('.') ? '' : '.'}`;
      });
  }
}

export default new JobService();