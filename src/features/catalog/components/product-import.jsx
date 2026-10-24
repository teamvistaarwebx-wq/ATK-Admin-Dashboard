"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ImagePlus,
  Loader2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { IMAGE_ACCEPT } from "@/constants/media";
import { csvToObjects, toCsv } from "@/lib/csv";
import { importProducts } from "../actions/import-products";
import {
  IMAGE_KEYS,
  IMPORT_BATCH_SIZE,
  IMPORT_COLUMNS,
  MAX_IMPORT_ROWS,
  SAMPLE_ROWS,
  canonicalKey,
  checkImportRow,
  isImageUrl,
  normaliseImportRecord,
  rowImages,
} from "../lib/product-import";
import { normaliseSku } from "../lib/product-input";
import { uploadProductImage } from "../lib/upload-product-image";

/** Photos uploaded at once. R2 is fine with more; a hotel Wi-Fi is not. */
const UPLOAD_CONCURRENCY = 4;

const RESULT_BADGE = {
  failed: { tone: "critical", label: "Not imported" },
  skipped: { tone: "neutral", label: "Skipped" },
  created: { tone: "attention", label: "Created" },
  updated: { tone: "attention", label: "Updated" },
};

const TEMPLATE_COLUMNS = IMPORT_COLUMNS.map((column) => ({
  header: column.header,
  value: (row) => row[column.key] ?? "",
}));

/**
 * Bulk product import, Shopify-style: download the sample, fill it in, drop
 * it here with the photos it names, preview, import.
 *
 * Everything that can be checked without the database is checked here, so
 * the preview shows every problem before anything is written. Photos named
 * in the file are matched to the files picked alongside it by name and
 * uploaded straight to R2 first; rows then go to the server in batches of
 * twenty, which re-checks each one and reports per row.
 */
export function ProductImport({ categories, existingSkus }) {
  const [step, setStep] = useState("select");
  const [csvFile, setCsvFile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [rows, setRows] = useState([]);
  const [fileError, setFileError] = useState("");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [defaultStatus, setDefaultStatus] = useState("draft");
  const [progress, setProgress] = useState({ label: "", done: 0, total: 0 });
  const [results, setResults] = useState([]);

  const known = useMemo(() => new Set(existingSkus), [existingSkus]);
  const photosByName = useMemo(
    () => new Map(photos.map((file) => [file.name.toLowerCase(), file])),
    [photos]
  );

  const checked = useMemo(() => {
    const seen = new Map();
    return rows.map((row) => {
      const sku = normaliseSku(row.sku);
      const exists = Boolean(sku && known.has(sku));
      const isNew = !exists;
      const errors = checkImportRow(row, {
        categories,
        isNew,
        resolveImage: (value) =>
          isImageUrl(value) || photosByName.has(value.toLowerCase()),
      });
      if (sku) {
        if (seen.has(sku)) errors.push(`Same SKU as row ${seen.get(sku)}.`);
        else seen.set(sku, row.line);
      }
      const action =
        errors.length > 0
          ? "error"
          : exists
            ? updateExisting
              ? "update"
              : "skip"
            : "create";
      return { row, errors, action };
    });
  }, [rows, categories, known, photosByName, updateExisting]);

  const counts = checked.reduce(
    (sum, item) => ({ ...sum, [item.action]: (sum[item.action] ?? 0) + 1 }),
    {}
  );
  const importable = checked.filter(
    (item) => item.action === "create" || item.action === "update"
  );

  async function readCsv(file) {
    setFileError("");
    setCsvFile(file);
    if (!file) return setRows([]);

    const text = await file.text();
    const { headers, rows: records } = csvToObjects(text);
    const columns = new Set(headers.map(canonicalKey));
    if (!columns.has("title") && !columns.has("sku")) {
      setRows([]);
      return setFileError(
        "This does not look like a product CSV — the first line should be the column headers. Start from the sample file."
      );
    }
    if (records.length === 0) {
      setRows([]);
      return setFileError("The file has headers but no products.");
    }
    if (records.length > MAX_IMPORT_ROWS) {
      setRows([]);
      return setFileError(
        `That is ${records.length} rows. Split it into files of ${MAX_IMPORT_ROWS} or fewer.`
      );
    }
    setRows(records.map(normaliseImportRecord));
  }

  async function runImport() {
    setStep("importing");
    const items = importable.map((item) => ({ ...item.row }));

    // 1. Photos named in the file, uploaded once each even if several rows share one.
    const needed = new Map();
    for (const row of items) {
      for (const image of rowImages(row)) {
        if (!isImageUrl(image))
          needed.set(
            image.toLowerCase(),
            photosByName.get(image.toLowerCase())
          );
      }
    }

    const uploaded = new Map();
    const failedUploads = new Map();
    const queue = [...needed.entries()];
    let done = 0;
    setProgress({ label: "Uploading photos", done: 0, total: queue.length });

    async function worker() {
      while (queue.length > 0) {
        const [name, file] = queue.shift();
        try {
          uploaded.set(name, await uploadProductImage(file));
        } catch (error) {
          failedUploads.set(name, error.message ?? "Upload failed");
        }
        done += 1;
        setProgress({ label: "Uploading photos", done, total: needed.size });
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, queue.length) }, worker)
    );

    // A row whose photo failed keeps the file name; the server rejects it
    // with a message that says which one.
    for (const row of items) {
      for (const key of IMAGE_KEYS) {
        const value = row[key];
        if (value && !isImageUrl(value) && uploaded.has(value.toLowerCase())) {
          row[key] = uploaded.get(value.toLowerCase());
        }
      }
    }

    // 2. Rows, in batches.
    const all = [];
    setProgress({ label: "Importing products", done: 0, total: items.length });
    for (let start = 0; start < items.length; start += IMPORT_BATCH_SIZE) {
      const batch = items.slice(start, start + IMPORT_BATCH_SIZE);
      try {
        const response = await importProducts({
          rows: batch,
          updateExisting,
          defaultStatus,
        });
        if (response?.error) throw new Error(response.error);
        all.push(...response.results);
      } catch (error) {
        all.push(
          ...batch.map((row) => ({
            line: row.line,
            sku: row.sku ?? "",
            title: row.title ?? "",
            status: "failed",
            messages: [
              error.message ||
                "The server did not answer. Try these rows again.",
            ],
          }))
        );
      }
      setProgress({
        label: "Importing products",
        done: Math.min(items.length, start + batch.length),
        total: items.length,
      });
    }

    for (const result of all) {
      const row = items.find((item) => item.line === result.line);
      const missing = row
        ? rowImages(row).filter((image) =>
            failedUploads.has(image.toLowerCase())
          )
        : [];
      if (missing.length > 0) {
        result.messages = [
          ...result.messages,
          ...missing.map(
            (name) =>
              `Photo “${name}”: ${failedUploads.get(name.toLowerCase())}`
          ),
        ];
      }
    }

    // Rows that never left the preview belong in the report too.
    const notSent = checked
      .filter((item) => item.action === "error" || item.action === "skip")
      .map((item) => ({
        line: item.row.line,
        sku: item.row.sku ?? "",
        title: item.row.title ?? "",
        status: item.action === "skip" ? "skipped" : "failed",
        messages:
          item.action === "skip"
            ? ["SKU already exists — updating was switched off."]
            : item.errors,
      }));

    setResults([...all, ...notSent].toSorted((a, b) => a.line - b.line));
    setStep("done");
  }

  function reset() {
    setStep("select");
    setCsvFile(null);
    setPhotos([]);
    setRows([]);
    setResults([]);
    setFileError("");
  }

  if (step === "importing") return <ImportProgress progress={progress} />;
  if (step === "done")
    return <ImportResults results={results} onReset={reset} />;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Start from the sample file
            </h2>
            <p className="mt-0.5 max-w-2xl text-xs text-muted">
              One row per product, with its SKU, name, category, price, stock,
              photos and SEO title and description. The same columns as Export,
              so you can export, edit and upload straight back.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                download(
                  "product_import_sample.csv",
                  toCsv(SAMPLE_ROWS, TEMPLATE_COLUMNS)
                )
              }
              className={buttonClass("secondary")}
            >
              <Download
                className="h-4 w-4"
                strokeWidth={2}
                aria-hidden="true"
              />
              Sample CSV
            </button>
            <button
              type="button"
              onClick={() =>
                download(
                  "product_import_template.csv",
                  toCsv([], TEMPLATE_COLUMNS)
                )
              }
              className={buttonClass("plain")}
            >
              Blank template
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DropZone
          icon={
            <FileSpreadsheet
              className="h-6 w-6"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          }
          title="Product CSV"
          hint="Saved as CSV (UTF-8) from Excel or Google Sheets."
          accept=".csv,text/csv"
          files={csvFile ? [csvFile] : []}
          onFiles={(files) => readCsv(files[0] ?? null)}
          error={fileError}
        />
        <DropZone
          icon={
            <ImagePlus
              className="h-6 w-6"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          }
          title="Product photos (optional)"
          hint="Pick every photo the CSV names by file name — JPEG, PNG, WebP or AVIF, 2MB each. Cells with a URL need no file."
          accept={IMAGE_ACCEPT}
          multiple
          files={photos}
          onFiles={(files) =>
            setPhotos((current) => {
              const byName = new Map(
                current.map((file) => [file.name.toLowerCase(), file])
              );
              for (const file of files)
                byName.set(file.name.toLowerCase(), file);
              return [...byName.values()];
            })
          }
        />
      </div>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-surface p-4 shadow-card">
        <label className="flex items-center gap-2 text-[0.8125rem] text-foreground">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(event) => setUpdateExisting(event.target.checked)}
            className="h-4 w-4 accent-[#303030]"
          />
          Update existing products with the same SKU
          <span className="text-xs text-muted">
            (only the filled-in columns change)
          </span>
        </label>
        <label className="flex items-center gap-2 text-[0.8125rem] text-foreground">
          New products without a Status are
          <select
            value={defaultStatus}
            onChange={(event) => setDefaultStatus(event.target.value)}
            className="h-8 rounded-lg border border-border-strong bg-surface px-2 text-[0.8125rem]"
          >
            <option value="draft">Draft (hidden)</option>
            <option value="active">Active (live)</option>
          </select>
        </label>
      </section>

      {rows.length > 0 ? (
        <Preview
          checked={checked}
          counts={counts}
          importable={importable.length}
          onImport={runImport}
        />
      ) : null}

      <ColumnGuide categories={categories} />
    </div>
  );
}

function Preview({ checked, counts, importable, onImport }) {
  const [onlyProblems, setOnlyProblems] = useState(false);
  const visible = onlyProblems
    ? checked.filter((item) => item.action === "error")
    : checked;

  return (
    <section className="overflow-hidden rounded-xl bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Preview</h2>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
            <span>{checked.length} rows</span>
            {counts.create ? <span>{counts.create} new</span> : null}
            {counts.update ? <span>{counts.update} to update</span> : null}
            {counts.skip ? <span>{counts.skip} skipped</span> : null}
            {counts.error ? (
              <span className="font-semibold text-danger">
                {counts.error} with problems
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {counts.error ? (
            <label className="flex items-center gap-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={onlyProblems}
                onChange={(event) => setOnlyProblems(event.target.checked)}
                className="h-4 w-4 accent-[#303030]"
              />
              Only rows with problems
            </label>
          ) : null}
          <button
            type="button"
            onClick={onImport}
            disabled={importable === 0}
            className={buttonClass("primary")}
          >
            <Upload className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Import {importable} {importable === 1 ? "product" : "products"}
          </button>
        </div>
      </div>

      {counts.error ? (
        <p className="border-t border-border bg-badge-attention/40 px-4 py-2 text-xs text-badge-attention-ink">
          Rows with problems are left out. Fix them in the file and upload it
          again — rows already imported will update rather than duplicate.
        </p>
      ) : null}

      <div className="max-h-[32rem] overflow-auto border-t border-border">
        <table className="w-full min-w-[52rem] text-left text-[0.8125rem]">
          <thead className="sticky top-0 z-10 bg-surface-subdued text-xs text-muted">
            <tr>
              <th className="py-2 pl-4 pr-2 font-medium">Row</th>
              <th className="px-2 py-2 font-medium">Product</th>
              <th className="px-2 py-2 font-medium">SKU</th>
              <th className="px-2 py-2 font-medium">Category</th>
              <th className="px-2 py-2 text-right font-medium">Price</th>
              <th className="px-2 py-2 text-right font-medium">Qty</th>
              <th className="px-2 py-2 font-medium">Photos</th>
              <th className="py-2 pl-2 pr-4 font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map(({ row, errors, action }) => (
              <tr key={row.line} className="align-top">
                <td className="py-2 pl-4 pr-2 tabular-nums text-muted">
                  {row.line}
                </td>
                <td className="max-w-64 px-2 py-2">
                  <span className="line-clamp-2 font-medium text-foreground">
                    {row.title || "—"}
                  </span>
                </td>
                <td className="px-2 py-2 text-muted">
                  {row.sku || "Generated"}
                </td>
                <td className="px-2 py-2">
                  {[row.parent_category, row.category]
                    .filter(Boolean)
                    .join(" › ") || "—"}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {row.price
                    ? `₹${row.price.replace(/^(₹|rs\.?)\s*/i, "")}`
                    : "—"}
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {row.quantity || "—"}
                </td>
                <td className="px-2 py-2 tabular-nums">
                  {rowImages(row).length}
                </td>
                <td className="py-2 pl-2 pr-4">
                  {action === "error" ? (
                    <div className="flex flex-col items-start gap-1">
                      <Badge tone="critical">Problem</Badge>
                      <ul className="flex flex-col gap-0.5 text-xs text-badge-critical-ink">
                        {errors.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : action === "update" ? (
                    <Badge tone="info">Update</Badge>
                  ) : action === "skip" ? (
                    <Badge tone="neutral">Skip · exists</Badge>
                  ) : (
                    <Badge tone="success">New</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ImportProgress({ progress }) {
  const percent =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <section className="flex flex-col items-center gap-3 rounded-xl bg-surface px-6 py-16 text-center shadow-card">
      <Loader2 className="h-6 w-6 animate-spin text-muted" aria-hidden="true" />
      <p className="text-sm font-semibold text-foreground">{progress.label}…</p>
      <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs tabular-nums text-muted" aria-live="polite">
        {progress.done} of {progress.total} · keep this tab open
      </p>
    </section>
  );
}

function ImportResults({ results, onReset }) {
  const created = results.filter((r) => r.status === "created").length;
  const updated = results.filter((r) => r.status === "updated").length;
  const problems = results.filter(
    (r) => r.status === "failed" || r.messages.length > 0
  );

  function downloadReport() {
    download(
      "product_import_report.csv",
      toCsv(results, [
        { header: "Row", value: (r) => r.line },
        { header: "SKU", value: (r) => r.sku },
        { header: "Title", value: (r) => r.title },
        { header: "Result", value: (r) => r.status },
        { header: "Messages", value: (r) => r.messages.join(" ") },
      ])
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-card">
        <div className="flex items-center gap-3">
          {problems.length === 0 ? (
            <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
          ) : (
            <TriangleAlert
              className="h-6 w-6 text-[#b28400]"
              aria-hidden="true"
            />
          )}
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {created} created · {updated} updated
              {problems.length > 0
                ? ` · ${problems.length} need attention`
                : ""}
            </h2>
            <p className="text-xs text-muted">
              Stock for every imported product is set and logged in stock
              history.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadReport}
            className={buttonClass("secondary")}
          >
            <Download className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            Download report
          </button>
          <button
            type="button"
            onClick={onReset}
            className={buttonClass("secondary")}
          >
            Import another file
          </button>
          <Link href="/products" className={buttonClass("primary")}>
            View products
          </Link>
        </div>
      </section>

      {problems.length > 0 ? (
        <section className="overflow-hidden rounded-xl bg-surface shadow-card">
          <h3 className="px-4 py-3 text-sm font-semibold text-foreground">
            Needs attention
          </h3>
          <ul className="divide-y divide-border border-t border-border">
            {problems.map((result) => (
              <li
                key={`${result.line}-${result.status}`}
                className="flex flex-wrap items-start gap-3 px-4 py-2.5 text-[0.8125rem]"
              >
                <span className="w-14 shrink-0 tabular-nums text-muted">
                  Row {result.line}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">
                    {result.title || result.sku || "Untitled"}
                  </span>
                  <span className="block text-xs text-badge-critical-ink">
                    {result.messages.join(" ")}
                  </span>
                </span>
                <Badge tone={RESULT_BADGE[result.status]?.tone ?? "neutral"}>
                  {RESULT_BADGE[result.status]?.label ?? result.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DropZone({
  icon,
  title,
  hint,
  accept,
  multiple = false,
  files,
  onFiles,
  error,
}) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        onFiles([...event.dataTransfer.files]);
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-surface px-6 py-8 text-center transition ${
        over
          ? "border-foreground/50 bg-surface-subdued"
          : error
            ? "border-danger/60"
            : "border-border-strong"
      }`}
    >
      <span className="text-muted">{icon}</span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={buttonClass("secondary", "sm")}
      >
        {multiple
          ? files.length > 0
            ? "Add more photos"
            : "Choose photos"
          : files.length > 0
            ? "Replace file"
            : "Choose file"}
      </button>
      <p className="max-w-sm text-xs text-muted">{hint}</p>
      {files.length > 0 ? (
        <p className="text-xs font-medium text-foreground">
          {multiple
            ? `${files.length} ${files.length === 1 ? "photo" : "photos"} ready`
            : files[0].name}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(event) => {
          onFiles([...event.target.files]);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function ColumnGuide({ categories }) {
  return (
    <details className="group overflow-hidden rounded-xl bg-surface shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-foreground">
        Column guide
        <span
          aria-hidden="true"
          className="text-muted transition group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full min-w-[40rem] text-left text-[0.8125rem]">
          <thead className="bg-surface-subdued text-xs text-muted">
            <tr>
              <th className="py-2 pl-4 pr-3 font-medium">Column</th>
              <th className="px-3 py-2 font-medium">
                Needed for a new product
              </th>
              <th className="py-2 pl-3 pr-4 font-medium">What goes in it</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {IMPORT_COLUMNS.map((column) => (
              <tr key={column.key}>
                <td className="whitespace-nowrap py-2 pl-4 pr-3 font-medium text-foreground">
                  {column.header}
                </td>
                <td className="px-3 py-2">
                  {column.required ? (
                    <Badge tone="attention">Required</Badge>
                  ) : (
                    <span className="text-muted">Optional</span>
                  )}
                </td>
                <td className="py-2 pl-3 pr-4 text-muted">
                  {column.note ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs font-semibold text-foreground">
          Categories you can use
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {categories.map((c) => `${c.parentName} › ${c.name}`).join(" · ") ||
            "None set up yet."}
        </p>
      </div>
    </details>
  );
}

function download(name, text) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/csv;charset=utf-8" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
