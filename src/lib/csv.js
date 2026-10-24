/**
 * CSV in both directions, RFC 4180 flavoured, with no dependency.
 *
 * Shared by the order export (server) and the product import (browser), so it
 * imports nothing. Excel is the spreadsheet everyone will open these in, which
 * decides two details: the export starts with a UTF-8 byte-order mark so ₹ and
 * Hindi names survive, and cells that look like formulas are defused.
 */

const NEEDS_QUOTES = /[",\r\n]/;
/** =, +, - and @ at the start of a cell make Excel evaluate it. */
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value) {
  if (value == null) return "";
  let text = String(value);
  // A phone number "+91…" is data, not a formula, but Excel cannot tell — a
  // leading apostrophe keeps it literal without showing in the cell.
  if (FORMULA_START.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** `columns`: [{ header, value: (row) => any }]. */
export function toCsv(rows, columns, { bom = true } = {}) {
  const lines = [columns.map((column) => cell(column.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => cell(column.value(row))).join(","));
  }
  return `${bom ? "﻿" : ""}${lines.join("\r\n")}\r\n`;
}

/**
 * Text → array of rows (arrays of strings). Handles quoted fields with commas,
 * doubled quotes and line breaks inside them, CRLF or LF endings, a BOM, and
 * trailing blank lines.
 */
export function parseCsv(text) {
  const source = String(text ?? "").replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === "") {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

/**
 * Rows with a header line → objects keyed by a normalised header
 * ("SEO Title" → "seo_title"), so a column renamed by a spreadsheet's
 * autocorrect still lands.
 */
export function csvToObjects(text) {
  const [header, ...body] = parseCsv(text);
  if (!header) return { headers: [], rows: [] };

  const keys = header.map(normaliseHeader);
  return {
    headers: keys,
    rows: body.map((cells, index) => {
      const record = { _line: index + 2 };
      keys.forEach((key, column) => {
        if (key) record[key] = (cells[column] ?? "").trim();
      });
      return record;
    }),
  };
}

export function normaliseHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
