import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

// Initialize Gemini API
const getGenAI = () => {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
    console.warn('WARNING: Gemini API Key is not set or using placeholder. AI features will fail.');
  }
  return new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
};

/**
 * Helper to call Gemini with a structured JSON schema.
 * @param {string} prompt - The user prompt
 * @param {object} schema - The expected JSON schema
 * @param {string} [systemInstruction] - Optional system instructions/role
 * @returns {Promise<object>} The parsed JSON output from Gemini
 */
export const generateStructuredContent = async (prompt, schema, systemInstruction = '') => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.2,
      },
    });

    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw Object.assign(
      new Error(`Gemini processing failed: ${error.message || 'Unknown AI error'}`),
      { status: 502 }
    );
  }
};

/**
 * Helper to call Gemini with regular text output (e.g. general chat or advice).
 * @param {string} prompt - The prompt
 * @param {string} [systemInstruction] - Optional role instruction
 * @returns {Promise<string>} Text output
 */
export const generateTextContent = async (prompt, systemInstruction = '') => {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL || 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
      },
    });

    return result.response.text();
  } catch (error) {
    console.error('Gemini Text API call failed:', error);
    throw Object.assign(
      new Error(`Gemini processing failed: ${error.message || 'Unknown AI error'}`),
      { status: 502 }
    );
  }
};
