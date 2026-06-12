import fs from 'fs/promises';
import mammoth from 'mammoth';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runPyMuPDFExtractor(buffer) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../utils/extract_pdf.py');
    const py = spawn('python', [scriptPath]);

    let stdoutData = Buffer.alloc(0);
    let stderrData = '';

    py.stdout.on('data', (chunk) => {
      stdoutData = Buffer.concat([stdoutData, chunk]);
    });

    py.stderr.on('data', (chunk) => {
      stderrData += chunk.toString('utf8');
    });

    py.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PyMuPDF extraction failed with code ${code}: ${stderrData}`));
      } else {
        resolve(stdoutData.toString('utf8'));
      }
    });

    py.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    py.stdin.write(buffer);
    py.stdin.end();
  });
}

export async function extractTextFromFile(file) {
  if (file.mimetype === 'text/plain') {
    return fs.readFile(file.path, 'utf8');
  }

  if (file.mimetype === 'application/pdf') {
    const buffer = await fs.readFile(file.path);
    return runPyMuPDFExtractor(buffer);
  }

  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: file.path });
    return result.value;
  }

  return '';
}

export async function extractTextFromBuffer(buffer, mimeType) {
  if (mimeType === 'text/plain') {
    return buffer.toString('utf8');
  }

  if (mimeType === 'application/pdf') {
    return runPyMuPDFExtractor(buffer);
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return '';
}

