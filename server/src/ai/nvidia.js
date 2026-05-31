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

const isRetryableError = (error) => {
  if (error.status === 429) return true;
  if (error.status >= 500 && error.status < 600) return true;
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') return true;
  if (error.message && (
    error.message.includes('rate limit') ||
    error.message.includes('timeout') ||
    error.message.includes('temporarily unavailable')
  )) return true;
  return false;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (fn, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 500, 8000);
        console.warn(`NVIDIA API retry ${attempt}/${maxRetries - 1} after ${Math.round(delay)}ms: ${error.message}`);
        await sleep(delay);
        continue;
      }

      break;
    }
  }

  throw lastError;
};

const buildCompletionMessages = (prompt, schema, systemInstruction = '') => {
  if (schema) {
    return [
      { role: 'system', content: `${systemInstruction}\nYou must respond with valid JSON only.` },
      { role: 'user', content: buildJsonPrompt(prompt, schema) },
    ];
  }

  return [
    ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
    { role: 'user', content: prompt },
  ];
};

const callNvidia = async (prompt, schema = null, systemInstruction = '', options = {}) => {
  const openai = getClient();
  const messages = buildCompletionMessages(prompt, schema, systemInstruction);

  const completion = await openai.chat.completions.create({
    model: env.NVIDIA_MODEL,
    messages,
    temperature: schema ? 0.2 : (options.temperature ?? 1),
    top_p: 0.95,
    max_tokens: options.maxTokens ?? 8192,
    stream: true,
  });

  const responseText = await readStream(completion);

  if (schema) {
    return parseJsonResponse(responseText);
  }

  return responseText;
};

/**
 * Helper to call NVIDIA's OpenAI-compatible endpoint with structured JSON output.
 * Includes retry logic with exponential backoff for transient failures.
 * @param {string} prompt - The user prompt
 * @param {object} schema - The expected JSON schema
 * @param {string} [systemInstruction] - Optional system instructions/role
 * @param {object} [options] - Additional options (temperature, maxTokens)
 * @returns {Promise<object>} The parsed JSON output from the model
 */
export const generateStructuredContent = async (prompt, schema, systemInstruction = '', options = {}) => {
  try {
    return await withRetry(() => callNvidia(prompt, schema, systemInstruction, options));
  } catch (error) {
    console.error('NVIDIA API call failed after retries:', error);
    throw Object.assign(
      new Error(`NVIDIA AI processing failed: ${error.message || 'Unknown AI error'}`),
      { status: 502, input: prompt }
    );
  }
};

/**
 * Helper to call NVIDIA's OpenAI-compatible endpoint with regular text output.
 * Includes retry logic with exponential backoff for transient failures.
 * @param {string} prompt - The prompt
 * @param {string} [systemInstruction] - Optional role instruction
 * @param {object} [options] - Additional options (temperature, maxTokens)
 * @returns {Promise<string>} Text output
 */
export const generateTextContent = async (prompt, systemInstruction = '', options = {}) => {
  try {
    return await withRetry(() => callNvidia(prompt, null, systemInstruction, options));
  } catch (error) {
    console.error('NVIDIA Text API call failed after retries:', error);
    throw Object.assign(
      new Error(`NVIDIA AI processing failed: ${error.message || 'Unknown AI error'}`),
      { status: 502, input: prompt }
    );
  }
};
