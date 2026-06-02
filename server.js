import express from 'express';
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT || 3002);
const resultsFilePath = path.resolve(process.env.RESULTS_FILE || path.join(__dirname, 'results.csv'));
const distPath = path.join(__dirname, 'dist');
const csvHeaders = ['entryId', 'name', 'email', 'score', 'completedAt'];
let writeQueue = Promise.resolve();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

async function ensureResultsFile() {
  try {
    await fsp.access(resultsFilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fsp.writeFile(resultsFilePath, `${csvHeaders.join(',')}\n`, 'utf8');
  }
}

function escapeCSVCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCSVLine(line) {
  const cells = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }

  cells.push(cell);
  return cells;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const cells = parseCSVLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));

    return {
      entryId: row.entryId,
      name: row.name,
      email: row.email,
      score: Number(row.score),
      completedAt: row.completedAt,
    };
  });
}

async function readResults() {
  await ensureResultsFile();
  const content = await fsp.readFile(resultsFilePath, 'utf8');
  return parseCSV(content);
}

async function appendResult(result) {
  await ensureResultsFile();
  const row = csvHeaders.map((header) => escapeCSVCell(result[header])).join(',');
  await fsp.appendFile(resultsFilePath, `${row}\n`, 'utf8');
}

function enqueueWrite(operation) {
  writeQueue = writeQueue.then(operation, operation);
  return writeQueue;
}

function sendStorageError(res, error) {
  console.error(error);
  res.status(500).json({
    message: 'Could not read or write results on the host laptop.',
  });
}

app.get('/api/results', async (req, res) => {
  try {
    const results = await readResults();
    res.json(results);
  } catch (error) {
    sendStorageError(res, error);
  }
});

app.post('/api/results', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const score = Number(req.body?.score);

  if (!name || !email || !Number.isFinite(score)) {
    res.status(400).json({
      message: 'Name, email, and numeric score are required.',
    });
    return;
  }

  try {
    const savedResult = await enqueueWrite(async () => {
      const result = {
        entryId: crypto.randomUUID(),
        name,
        email,
        score,
        completedAt: new Date().toISOString(),
      };

      await appendResult(result);
      return result;
    });

    res.status(201).json(savedResult);
  } catch (error) {
    sendStorageError(res, error);
  }
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
      return;
    }

    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Quiz backend running at http://0.0.0.0:${PORT}`);
  console.log(`Saving results to ${resultsFilePath}`);
});
