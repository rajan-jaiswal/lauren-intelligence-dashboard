const xlsx    = require('xlsx');
const pdfParse = require('pdf-parse');

// ─────────────────────────────────────────────────────────────────────────────
// parseFile — turn a single uploaded buffer into a plain JS value
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse one file buffer into a plain JS value.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} originalname
 * @returns {Promise<object|string>}
 */
async function parseFile(buffer, mimetype, originalname) {
  const ext = (originalname || '').toLowerCase().split('.').pop();

  // ── JSON ────────────────────────────────────────────────────────────────────
  if (ext === 'json' || mimetype === 'application/json') {
    try {
      return JSON.parse(buffer.toString('utf8'));
    } catch (_) {
      return { raw: buffer.toString('utf8') };
    }
  }

  // ── CSV ─────────────────────────────────────────────────────────────────────
  if (ext === 'csv' || mimetype === 'text/csv') {
    return parseCSV(buffer.toString('utf8'));
  }

  // ── Excel (.xlsx / .xls) ────────────────────────────────────────────────────
  if (
    ['xlsx', 'xls'].includes(ext) ||
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel'
  ) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const result = {};
    for (const sheetName of workbook.SheetNames) {
      result[sheetName] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    return result;
  }

  // ── PDF ─────────────────────────────────────────────────────────────────────
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    try {
      const data = await pdfParse(buffer);
      return {
        type: 'pdf',
        filename: originalname,
        pageCount: data.numpages,
        text: data.text,
      };
    } catch (err) {
      return { type: 'pdf', filename: originalname, error: err.message, text: '' };
    }
  }

  // ── Plain text / markdown / anything else ───────────────────────────────────
  return { text: buffer.toString('utf8') };
}

// ─────────────────────────────────────────────────────────────────────────────
// parseFiles — merge multiple uploaded files into a single context object
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse an array of multer file objects and merge into one combined context.
 * @param {Array<{buffer: Buffer, mimetype: string, originalname: string}>} files
 * @returns {Promise<{files: Array, combined: string}>}
 */
async function parseFiles(files) {
  if (!files || files.length === 0) return null;

  const parsed = await Promise.all(
    files.map((f) => parseFile(f.buffer, f.mimetype, f.originalname))
  );

  // Build a single text blob that Gemini can read
  const combinedParts = parsed.map((result, i) => {
    const name = files[i].originalname;
    if (typeof result === 'string') return `--- FILE: ${name} ---\n${result}`;
    if (result?.text)               return `--- FILE: ${name} ---\n${result.text}`;
    return `--- FILE: ${name} ---\n${JSON.stringify(result, null, 2)}`;
  });

  return {
    fileCount: files.length,
    fileNames: files.map((f) => f.originalname),
    files: parsed,
    combined: combinedParts.join('\n\n'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] !== undefined ? values[idx].trim().replace(/^"|"$/g, '') : '';
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

module.exports = { parseFile, parseFiles };
