import OpenAI from 'openai';
import env from '../config/env.js';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

const getClient = () => {
  if (!env.NVIDIA_API_KEY || env.NVIDIA_API_KEY === 'your-nvidia-api-key-here') {
    console.warn('WARNING: NVIDIA API key is not set or is using a placeholder. AI features will fail.');
  }

  return new OpenAI({
    apiKey: env.NVIDIA_API_KEY || '',
    baseURL: NVIDIA_BASE_URL,
  });
};

const readStream = async (completion) => {
  let output = '';

  for await (const chunk of completion) {
    output += chunk.choices[0]?.delta?.content || '';
  }

  return output;
};

const buildJsonPrompt = (prompt, schema) => {
  return `${prompt}

Return only valid JSON matching this schema. Do not include markdown fences or commentary.

Schema:
${JSON.stringify(schema, null, 2)}`;
};

const parseJsonResponse = (text) => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  return JSON.parse(cleaned);
};

/**
 * Helper to call NVIDIA's OpenAI-compatible endpoint with structured JSON output.
 * @param {string} prompt - The user prompt
 * @param {object} schema - The expected JSON schema
 * @param {string} [systemInstruction] - Optional system instructions/role
 * @returns {Promise<object>} The parsed JSON output from the model
 */
export const generateStructuredContent = async (prompt, schema, systemInstruction = '') => {
  try {
    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: env.NVIDIA_MODEL,
      messages: [
        {
          role: 'system',
          content: `${systemInstruction}\nYou must respond with valid JSON only.`,
        },
        {
          role: 'user',
          content: buildJsonPrompt(prompt, schema),
        },
      ],
      temperature: 0.2,
      top_p: 0.95,
      max_tokens: 8192,
      stream: true,
    });

    const responseText = await readStream(completion);
    return parseJsonResponse(responseText);
  } catch (error) {
    console.error('NVIDIA API call failed:', error);
    throw Object.assign(
      new Error(`NVIDIA AI processing failed: ${error.message || 'Unknown AI error'}`),
      { status: 502 }
    );
  }
};

/**
 * Helper to call NVIDIA's OpenAI-compatible endpoint with regular text output.
 * @param {string} prompt - The prompt
 * @param {string} [systemInstruction] - Optional role instruction
 * @returns {Promise<string>} Text output
 */
export const generateTextContent = async (prompt, systemInstruction = '') => {
  try {
    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: env.NVIDIA_MODEL,
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 8192,
      stream: true,
    });

    return readStream(completion);
  } catch (error) {
    console.error('NVIDIA Text API call failed:', error);
    throw Object.assign(
      new Error(`NVIDIA AI processing failed: ${error.message || 'Unknown AI error'}`),
      { status: 502 }
    );
  }
};
