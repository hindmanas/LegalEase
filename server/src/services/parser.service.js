import fs from 'fs/promises';
import mammoth from 'mammoth';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runPyMuPDFExtractor(input) {
  return new Promise(async (resolve, reject) => {
    let tempFilePath = null;
    let filePathToUse = null;

    try {
      if (Buffer.isBuffer(input)) {
        const tempDir = path.join(__dirname, '../../uploads');
        await fs.mkdir(tempDir, { recursive: true });
        const tempFileName = `temp-${crypto.randomBytes(8).toString('hex')}.pdf`;
        tempFilePath = path.join(tempDir, tempFileName);
        await fs.writeFile(tempFilePath, input);
        filePathToUse = tempFilePath;
      } else if (typeof input === 'string') {
        filePathToUse = input;
      } else {
        return reject(new Error('Invalid input: expected Buffer or file path string.'));
      }

      const scriptPath = path.join(__dirname, '../utils/extract_pdf.py');
      const pythonCommands = ['python', 'python3', 'py'];
      let spawnError = null;
      let stdoutData = Buffer.alloc(0);
      let stderrData = '';

      const attemptSpawn = (index) => {
        if (index >= pythonCommands.length) {
          cleanup().then(() => {
            reject(new Error(`Failed to start Python process: ${spawnError?.message || 'No python command available'}`));
          });
          return;
        }

        const cmd = pythonCommands[index];
        const py = spawn(cmd, [scriptPath, filePathToUse]);

        py.stdout.on('data', (chunk) => {
          stdoutData = Buffer.concat([stdoutData, chunk]);
        });

        py.stderr.on('data', (chunk) => {
          const str = chunk.toString('utf8');
          stderrData += str;
          
          // Print progress to server console
          const lines = str.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('PROGRESS:')) {
              const msg = line.trim().substring(9);
              console.log(`\x1b[36m[PyMuPDF Extractor]\x1b[0m ${msg}`);
            }
          }
        });

        py.on('close', (code) => {
          cleanup().then(() => {
            if (code !== 0) {
              reject(new Error(`PyMuPDF extraction failed with code ${code}: ${stderrData}`));
            } else {
              resolve(stdoutData.toString('utf8'));
            }
          });
        });

        py.on('error', (err) => {
          spawnError = err;
          attemptSpawn(index + 1);
        });
      };

      const cleanup = async () => {
        if (tempFilePath) {
          await fs.unlink(tempFilePath).catch((err) => {
            console.error('Failed to clean up temporary extraction file:', err);
          });
        }
      };

      attemptSpawn(0);
    } catch (err) {
      if (tempFilePath) {
        await fs.unlink(tempFilePath).catch(() => {});
      }
      reject(err);
    }
  });
}

async function runPdfParseExtractor(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text || '';
  } catch (error) {
    console.error('pdf-parse extraction failed:', error);
    throw error;
  }
}

export async function extractTextFromFile(file) {
  if (file.mimetype === 'text/plain') {
    return fs.readFile(file.path, 'utf8');
  }

  if (file.mimetype === 'application/pdf') {
    try {
      return await runPyMuPDFExtractor(file.path);
    } catch (pymupdfError) {
      console.warn('PyMuPDF extraction failed. Falling back to pdf-parse.', pymupdfError.message);
      const buffer = await fs.readFile(file.path);
      return await runPdfParseExtractor(buffer);
    }
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
    try {
      return await runPyMuPDFExtractor(buffer);
    } catch (pymupdfError) {
      console.warn('PyMuPDF extraction failed. Falling back to pdf-parse.', pymupdfError.message);
      return await runPdfParseExtractor(buffer);
    }
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return '';
}

