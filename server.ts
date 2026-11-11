/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getOrCreateUser } from './src/db/users.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google Gemini SDK
const ai = new GoogleGenAI();

// User synchronization endpoint
app.post('/api/auth/sync-user', async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing uid or email' });
    }
    const user = await getOrCreateUser(uid, email, displayName);
    res.json({ success: true, user });
  } catch (err: any) {
    console.error('Failed to sync user to Cloud SQL:', err);
    res.status(500).json({ error: 'User sync failed', details: err.message });
  }
});

// Gemini AI Chatbot with Search Grounding & Maps Grounding
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      model = 'gemini-3.8-flash',
      groundingType = 'auto', // 'search' | 'maps' | 'none' | 'auto'
      propertyContext,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const systemPrompt = `You are the specialized AI Legal & Field Advisor for the "Taman Seri Gedung" Housing Revitalization Project (637 landed terrace units in Sungai Petani, Kedah, Malaysia).
Your role is to assist field coordinators, lawyers, and municipal administrators with:
1. Explaining Malaysian Land Law, National Land Code (KTN), and Memorandum of Transfer (Borang 14A) execution.
2. Advising on estate administration for deceased original 1988 SPA purchasers: Surat Kuasa Mentadbir (Letter of Administration), Small Estates Distribution Act 1955 (Akta Pembahagian Pusaka Kecil), and waris consensus.
3. Advising on Majlis Perbandaran Sungai Petani (MPSPK) assessment tax (Cukai Pintu) arrears, waiver appeal procedures, and title regularization.
4. Analyzing property records from the 637-unit estate (House No, Cadastral Lots, Geran titles, and site conditions).
5. Assisting with field navigation and local government offices in Sungai Petani (Pejabat Tanah dan Galian Kuala Muda, MPSPK, Mahkamah, Balai Polis).

${propertyContext ? `CURRENT PROPERTY DOSSIER CONTEXT:\n${JSON.stringify(propertyContext, null, 2)}` : ''}

Be precise, respectful, and authoritative with Malaysian land terminology (e.g. Pentadbir, Waris, Pejabat Tanah, Borang 14A, Hakmilik Kekal/Geran, HSD, Cukai Pintu). Always format answers cleanly with headings or bullet points where helpful.`;

    // Configure tools according to grounding requirement
    const tools: any[] = [];
    if (groundingType === 'search') {
      tools.push({ googleSearch: {} });
    } else if (groundingType === 'maps') {
      tools.push({ googleMaps: {} });
    } else if (groundingType === 'auto') {
      // Auto-enable search grounding for recent legal / government information
      tools.push({ googleSearch: {} });
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || m.text || '' }],
    }));

    const response = await ai.models.generateContent({
      model: model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        tools: tools.length > 0 ? tools : undefined,
      },
    });

    const candidate = response.candidates?.[0];
    const responseText = response.text || candidate?.content?.parts?.[0]?.text || '';
    
    // Extract grounding metadata if present
    const groundingMetadata = candidate?.groundingMetadata;

    res.json({
      text: responseText,
      groundingMetadata: groundingMetadata || null,
      modelUsed: model,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      error: 'Gemini processing failed',
      details: error.message || String(error),
    });
  }
});

// Mount Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Taman Seri Gedung server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
