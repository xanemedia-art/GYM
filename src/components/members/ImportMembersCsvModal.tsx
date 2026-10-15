"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Table,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";

interface ImportMembersCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchName?: string;
}

const SAMPLE_CSV_DATA = `First Name,Last Name,Phone,Gender,Member Code,Date of Birth,Email,Plan Name,Start Date,End Date,Door Lock UID,Emergency Phone,Notes
Rahul,Sharma,9816011111,MALE,BFF-DH-1001,1995-05-12,rahul.sharma@gmail.com,Monthly Strength Pass,2026-10-01,2026-10-31,1001,9816099999,Morning strength batch
Priya,Thakur,9816022222,FEMALE,BFF-DH-1002,1998-08-20,priya.thakur@gmail.com,3-Month Transformation Pass,2026-09-15,2026-12-15,1002,9816088888,Weight training & cardio
Amit,Chauhan,9816033333,MALE,BFF-DH-1003,1992-11-03,amit.chauhan@gmail.com,Annual Elite Pass,2026-01-01,2026-12-31,1003,9816077777,Cross-branch VIP member
Sunita,Verma,9816044444,FEMALE,BFF-DH-1004,1990-02-14,sunita.v@gmail.com,Monthly Strength Pass,2026-10-10,2026-11-09,1004,9816066666,Evening personal training`;

function parseCsvString(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  // Determine delimiter: comma, tab, or semicolon
  const headerLine = lines[0];
  let delimiter = ",";
  if (headerLine.includes("\t")) delimiter = "\t";
  else if (headerLine.includes(";") && !headerLine.includes(",")) delimiter = ";";

  const splitRow = (row: string) => {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map((item) => item.replace(/^"|"$/g, "").trim());
  };

  const rawHeaders = splitRow(headerLine);
  // Normalize header names
  const normalizedHeaders = rawHeaders.map((h) => {
    const clean = h.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.includes("firstname") || clean === "fname") return "firstName";
    if (clean.includes("lastname") || clean === "lname") return "lastName";
    if (clean === "name" || clean === "fullname" || clean === "membername") return "fullName";
    if (clean.includes("phone") || clean.includes("mobile") || clean === "contact") return "phone";
    if (clean.includes("gender") || clean === "sex") return "gender";
    if (clean.includes("code") || clean.includes("memberid") || clean === "id") return "memberCode";
    if (clean.includes("dob") || clean.includes("birth")) return "dateOfBirth";
    if (clean.includes("mail")) return "email";
    if (clean.includes("plan") || clean.includes("package") || clean.includes("membership")) return "planName";
    if (clean.includes("start") || clean.includes("joindate")) return "startDate";
    if (clean.includes("end") || clean.includes("expiry") || clean.includes("validtill")) return "endDate";
    if (clean.includes("uid") || clean.includes("rfid") || clean.includes("card") || clean.includes("biometric")) return "doorLockUid";
    if (clean.includes("emergency") || clean.includes("guardian")) return "emergencyContactPhone";
    if (clean.includes("note") || clean.includes("remark")) return "notes";
    return h;
  });

  const parsedRows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i]);
    if (values.length === 0 || values.every((v) => v === "")) continue;

    const rowObj: Record<string, string> = {};
    normalizedHeaders.forEach((key, idx) => {
      rowObj[key] = values[idx] || "";
    });

    parsedRows.push(rowObj);
  }

  return parsedRows;
}

export function ImportMembersCsvModal({
  isOpen,
  onClose,
  onSuccess,
  branchName = "Active Gym Branch",
}: ImportMembersCsvModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "sample">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV_DATA], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `befree_members_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_CSV_DATA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setAnalysisResult(null);
    setImportResult(null);
    setAnalyzing(true);

    try {
      const text = await file.text();
      const rows = parseCsvString(text);

      if (rows.length === 0) {
        throw new Error("No data rows found in CSV file. Please verify file format.");
      }

      setParsedRows(rows);

      // Perform dry-run preview on server
      const res = await fetch("/api/v1/members/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, preview: true }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to validate CSV");
      }

      setAnalysisResult(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV file");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/members/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, preview: false }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Import failed");
      }

      setImportResult(json.data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to import members");
    } finally {
      setImporting(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setAnalysisResult(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Bulk Member Import (CSV / Excel)</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  {branchName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Import past member rosters, assign gym packages, and link door biometric RFID cards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "upload"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload CSV File</span>
              {analysisResult && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {analysisResult.validCount} Valid
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("sample")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "sample"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Sample CSV Format & Template</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSampleCsv}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Sample CSV Template</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: UPLOAD & IMPORT */}
          {activeTab === "upload" && (
            <div className="space-y-5">
              {!importResult ? (
                <>
                  {/* File Dropzone */}
                  {!selectedFile ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-emerald-50/20 group"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv,application/vnd.ms-excel"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:scale-105 transition-all mx-auto mb-3">
                        <Upload className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 mb-1">
                        Select or Drop Previous Data CSV File
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Exports from Excel (.csv) with member names, phone numbers, package names, and biometric RFID UIDs
                      </p>

                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs group-hover:border-emerald-300">
                        <span>Browse Files from Computer</span>
                      </div>
                    </div>
                  ) : (
                    /* File Selected & Validation Summary */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{selectedFile.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {(selectedFile.size / 1024).toFixed(1)} KB • {parsedRows.length} total rows parsed
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={resetUpload}
                          className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                        >
                          Change File
                        </button>
                      </div>

                      {analyzing ? (
                        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                          <span>Validating member records and detecting duplicates in {branchName}...</span>
                        </div>
                      ) : analysisResult ? (
                        <div className="space-y-4">
                          {/* Metrics Stat Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
                              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                Ready to Import
                              </div>
                              <div className="text-xl font-black text-emerald-900 mt-0.5">
                                {analysisResult.validCount} Members
                              </div>
                              <div className="text-[10px] text-emerald-600 mt-1">
                                Will be registered with active passes
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80">
                              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                Duplicate Phones (Skipping)
                              </div>
                              <div className="text-xl font-black text-amber-900 mt-0.5">
                                {analysisResult.duplicateCount} Members
                              </div>
                              <div className="text-[10px] text-amber-600 mt-1">
                                Protected from duplicate overwrites
                              </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Invalid / Missing Info
                              </div>
                              <div className="text-xl font-black text-slate-800 mt-0.5">
                                {analysisResult.errorCount} Rows
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                Missing phone or required name
                              </div>
                            </div>
                          </div>

                          {/* Preview Table */}
                          <div>
                            <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                              <span>Parsed Rows Dry Run Preview</span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                Showing first {Math.min(20, analysisResult.rows.length)} of {analysisResult.rows.length} rows
                              </span>
                            </div>

                            <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs text-slate-700">
                                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 sticky top-0">
                                  <tr>
                                    <th className="px-3 py-2">Row</th>
                                    <th className="px-3 py-2">Member Name</th>
                                    <th className="px-3 py-2">Phone</th>
                                    <th className="px-3 py-2">Gender</th>
                                    <th className="px-3 py-2">Assigned Package</th>
                                    <th className="px-3 py-2">RFID UID</th>
                                    <th className="px-3 py-2 text-right">Validation Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {analysisResult.rows.slice(0, 25).map((row: any) => (
                                    <tr key={row.rowNumber} className="hover:bg-slate-50/70">
                                      <td className="px-3 py-2 font-mono text-[11px] text-slate-400">
                                        #{row.rowNumber}
                                      </td>
                                      <td className="px-3 py-2 font-bold text-slate-900 truncate max-w-[140px]">
                                        {row.fullName}
                                      </td>
                                      <td className="px-3 py-2 font-mono text-[11px]">{row.phone}</td>
                                      <td className="px-3 py-2 text-[11px]">{row.gender}</td>
                                      <td className="px-3 py-2 truncate max-w-[150px]">
                                        {row.planName ? (
                                          <span className="font-semibold text-emerald-800">
                                            {row.planName}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">No Plan</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                                        {row.doorLockUid || "—"}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {row.statusBadge === "VALID" ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Ready
                                          </span>
                                        ) : row.statusBadge === "DUPLICATE_SKIPPED" ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800" title={row.issues.join(", ")}>
                                            <AlertTriangle className="h-3 w-3" />
                                            Duplicate (Skip)
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={row.issues.join(", ")}>
                                            <AlertCircle className="h-3 w-3" />
                                            Error
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                            <div className="text-xs text-slate-500">
                              Target Branch: <strong className="text-slate-800">{branchName}</strong>
                            </div>

                            <button
                              onClick={handleExecuteImport}
                              disabled={importing || analysisResult.validCount === 0}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {importing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Importing {analysisResult.validCount} Members...</span>
                                </>
                              ) : (
                                <>
                                  <span>Import {analysisResult.validCount} Members into {branchName}</span>
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                /* Import Success State */
                <div className="text-center py-8 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Import Successful!</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Successfully registered <strong>{importResult.importedCount} members</strong> into{" "}
                      <strong>{branchName}</strong>.
                      {importResult.skippedCount > 0 && (
                        <span> ({importResult.skippedCount} duplicates were safely skipped).</span>
                      )}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-all"
                    >
                      View Members Directory
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAMPLE CSV DATA & GUIDELINES */}
          {activeTab === "sample" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Standard Be Free Fitness CSV Specification
                    </h4>
                    <p className="text-xs text-emerald-800/80 mt-0.5">
                      You can paste your Excel rows directly into this format. Missing fields will be automatically defaulted (Member code auto-generated, end date auto-calculated from plan).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopySample}
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100/50 flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Copied!" : "Copy CSV"}</span>
                  </button>

                  <button
                    onClick={handleDownloadSampleCsv}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .CSV</span>
                  </button>
                </div>
              </div>

              {/* In-App Visual Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Sample Member Dataset Preview</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5">First Name *</th>
                        <th className="px-3 py-2.5">Last Name</th>
                        <th className="px-3 py-2.5">Phone (10 Digits) *</th>
                        <th className="px-3 py-2.5">Gender</th>
                        <th className="px-3 py-2.5">Member Code</th>
                        <th className="px-3 py-2.5">Date of Birth</th>
                        <th className="px-3 py-2.5">Plan Name</th>
                        <th className="px-3 py-2.5">Start Date</th>
                        <th className="px-3 py-2.5">End Date</th>
                        <th className="px-3 py-2.5">RFID UID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Rahul</td>
                        <td className="px-3 py-2">Sharma</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">9816011111</td>
                        <td className="px-3 py-2">MALE</td>
                        <td className="px-3 py-2 text-slate-500">BFF-DH-1001</td>
                        <td className="px-3 py-2">1995-05-12</td>
                        <td className="px-3 py-2 font-semibold text-emerald-800">Monthly Strength Pass</td>
                        <td className="px-3 py-2">2026-10-01</td>
                        <td className="px-3 py-2">2026-10-31</td>
                        <td className="px-3 py-2 text-slate-600">1001</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Priya</td>
                        <td className="px-3 py-2">Thakur</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">9816022222</td>
                        <td className="px-3 py-2">FEMALE</td>
                        <td className="px-3 py-2 text-slate-500">BFF-DH-1002</td>
                        <td className="px-3 py-2">1998-08-20</td>
                        <td className="px-3 py-2 font-semibold text-emerald-800">3-Month Transformation Pass</td>
                        <td className="px-3 py-2">2026-09-15</td>
                        <td className="px-3 py-2">2026-12-15</td>
                        <td className="px-3 py-2 text-slate-600">1002</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-bold text-slate-900">Amit</td>
                        <td className="px-3 py-2">Chauhan</td>
                        <td className="px-3 py-2 text-emerald-700 font-bold">9816033333</td>
                        <td className="px-3 py-2">MALE</td>
                        <td className="px-3 py-2 text-slate-500">BFF-DH-1003</td>
                        <td className="px-3 py-2">1992-11-03</td>
                        <td className="px-3 py-2 font-semibold text-emerald-800">Annual Elite Pass</td>
                        <td className="px-3 py-2">2026-01-01</td>
                        <td className="px-3 py-2">2026-12-31</td>
                        <td className="px-3 py-2 text-slate-600">1003</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Column Guidelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-emerald-600" />
                    <span>Mandatory Columns</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px]">
                    <li><strong>First Name</strong>: Member given name (or Full Name column)</li>
                    <li><strong>Phone</strong>: Valid 10-digit mobile number for WhatsApp & notifications</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Smart Auto-Detection</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px]">
                    <li><strong>Plan Name</strong>: Auto-linked to matching branch membership plans</li>
                    <li><strong>Member Code</strong>: Auto-generated sequential code if left empty</li>
                    <li><strong>RFID Card / UID</strong>: Auto-enrolled into eSSL turnstile access</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
