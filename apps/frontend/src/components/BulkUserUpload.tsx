import React, { useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Eye,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import type {
  ExcelUploadRequest,
  ExcelValidationResponse,
  BulkCreateUsersResponse,
  BulkUserResult,
} from "shared-types";

interface BulkUserUploadProps {
  onComplete?: (result: BulkCreateUsersResponse) => void;
  className?: string;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  data: string; // base64
}

interface ValidationResult {
  isValid: boolean;
  data: ExcelValidationResponse["data"] | null;
  errors: string[];
}

export function BulkUserUpload({ onComplete, className }: BulkUserUploadProps) {
  const [currentStep, setCurrentStep] = useState<
    "upload" | "validate" | "confirm" | "processing" | "complete"
  >("upload");
  const [file, setFile] = useState<FileInfo | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [uploadResult, setUploadResult] =
    useState<BulkCreateUsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [".xlsx", ".xls"];
    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));

    if (!allowedTypes.includes(fileExtension)) {
      setError(
        `Invalid file type. Only ${allowedTypes.join(", ")} files are supported.`
      );
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFile({
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          data: result,
        });
        setError(null);
        setCurrentStep("validate");
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(selectedFile);
  };

  // Validate Excel file
  const validateFile = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const payload: ExcelUploadRequest = {
        file_data: file.data,
        file_name: file.name,
        header_row: 1,
        data_start_row: 2,
        options: {
          validate_only: true,
          skip_duplicates: false,
          default_role: "participant",
        },
      };

      const response = await fetch("/api/v1/users/bulk/validate-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setValidationResult({
          isValid: true,
          data: result.data,
          errors: [],
        });
        setCurrentStep("confirm");
      } else {
        setValidationResult({
          isValid: false,
          data: null,
          errors: result.errors?.map((e: any) => e.message) || [result.message],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      setValidationResult({
        isValid: false,
        data: null,
        errors: ["Network error occurred"],
      });
    } finally {
      setLoading(false);
    }
  };

  // Create users from Excel
  const createUsers = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setCurrentStep("processing");
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const payload: ExcelUploadRequest = {
        file_data: file.data,
        file_name: file.name,
        header_row: 1,
        data_start_row: 2,
        options: {
          validate_only: false,
          skip_duplicates: true,
          default_role: "participant",
        },
      };

      const response = await fetch("/api/v1/users/bulk/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      const result: BulkCreateUsersResponse = await response.json();

      setProgress(100);
      setUploadResult(result);
      setCurrentStep("complete");

      if (onComplete) {
        onComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setCurrentStep("confirm");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  // Reset to start
  const resetUpload = () => {
    setCurrentStep("upload");
    setFile(null);
    setValidationResult(null);
    setUploadResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download template
  const downloadTemplate = () => {
    // Create CSV template
    const headers = [
      "NIK",
      "Nama",
      "Email",
      "Jenis Kelamin",
      "No HP",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Agama",
      "Pendidikan",
      "Alamat",
      "Provinsi",
      "Kabupaten/Kota",
      "Kecamatan",
      "Kelurahan/Desa",
      "Kode Pos",
    ];

    const sampleData = [
      [
        "1234567890123456",
        "John Doe",
        "john@example.com",
        "L",
        "+628123456789",
        "Jakarta",
        "1990-01-01",
        "Islam",
        "S1",
        "Jl. Sudirman No. 123",
        "DKI Jakarta",
        "Jakarta Pusat",
        "Menteng",
        "Menteng",
        "10310",
      ],
    ];

    const csvContent = [headers, ...sampleData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_users_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Bulk User Import</h2>
        <p className="text-muted-foreground">
          Upload an Excel file to create multiple users at once
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[
          { key: "upload", label: "Upload File", icon: Upload },
          { key: "validate", label: "Validate Data", icon: FileText },
          { key: "confirm", label: "Confirm Import", icon: Eye },
          { key: "processing", label: "Processing", icon: Users },
          { key: "complete", label: "Complete", icon: CheckCircle2 },
        ].map((step, index) => {
          const isActive = currentStep === step.key;
          const isCompleted =
            ["upload", "validate", "confirm", "processing"].indexOf(
              currentStep
            ) >
            ["upload", "validate", "confirm", "processing"].indexOf(step.key);

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : isActive
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-500"
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <span
                className={`ml-2 text-sm ${
                  isActive ? "text-blue-600 font-medium" : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
              {index < 4 && <div className="w-8 h-px bg-gray-300 mx-4" />}
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Upload Step */}
          {currentStep === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:border-gray-400 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Choose Excel file to upload
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supported formats: .xlsx, .xls (Max 10MB)
                  </p>
                  <Button>Select File</Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  File Requirements:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Excel format (.xlsx or .xls)</li>
                  <li>• Headers in row 1, data starting from row 2</li>
                  <li>
                    • Required columns: NIK, Nama, Email, Jenis Kelamin, No HP
                  </li>
                  <li>• Maximum 1000 users per file</li>
                  <li>• File size limit: 10MB</li>
                </ul>
              </div>
            </div>
          )}

          {/* Validate Step */}
          {currentStep === "validate" && file && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={validateFile}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Validating..." : "Validate File"}
                </Button>

                {validationResult && !validationResult.isValid && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validationResult.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={resetUpload}>
                  Choose Different File
                </Button>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {currentStep === "confirm" && validationResult?.data && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">
                  File Validation Successful
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {validationResult.data.validation_summary.valid_rows}
                    </div>
                    <div className="text-sm text-gray-500">Valid Users</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {validationResult.data.validation_summary.invalid_rows}
                    </div>
                    <div className="text-sm text-gray-500">Invalid Users</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {validationResult.data.validation_summary.duplicate_niks}
                    </div>
                    <div className="text-sm text-gray-500">Duplicate NIKs</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {
                        validationResult.data.validation_summary
                          .duplicate_emails
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      Duplicate Emails
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Preview Results */}
              {validationResult.data.preview_results.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">
                    Preview Results (First 10 rows)
                  </h4>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Row</th>
                          <th className="px-4 py-2 text-left">NIK</th>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-left">Email</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.data.preview_results.map(
                          (result, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-2">{result.row_number}</td>
                              <td className="px-4 py-2">{result.nik}</td>
                              <td className="px-4 py-2">{result.name}</td>
                              <td className="px-4 py-2">{result.email}</td>
                              <td className="px-4 py-2">
                                <Badge
                                  variant={
                                    result.status === "success"
                                      ? "default"
                                      : result.status === "error"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {result.status}
                                </Badge>
                                {result.error && (
                                  <div className="text-xs text-red-600 mt-1">
                                    {result.error.message}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("validate")}
                >
                  Back to Validation
                </Button>
                <Button
                  onClick={createUsers}
                  disabled={
                    validationResult.data.validation_summary.valid_rows === 0
                  }
                  className="flex-1"
                >
                  Create {validationResult.data.validation_summary.valid_rows}{" "}
                  Users
                </Button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {currentStep === "processing" && (
            <div className="space-y-6 text-center">
              <div>
                <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Creating Users...</h3>
                <p className="text-gray-500">
                  Please wait while we process your file
                </p>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-500">{progress}% complete</p>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === "complete" && uploadResult && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Import Complete!</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {uploadResult.data.total_processed}
                    </div>
                    <div className="text-sm text-gray-500">Total Processed</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.data.successful}
                    </div>
                    <div className="text-sm text-gray-500">
                      Successfully Created
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadResult.data.failed}
                    </div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {uploadResult.data.skipped}
                    </div>
                    <div className="text-sm text-gray-500">Skipped</div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Table */}
              {uploadResult.data.results.length > 0 && (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All Results</TabsTrigger>
                    <TabsTrigger value="success">Success</TabsTrigger>
                    <TabsTrigger value="error">Errors</TabsTrigger>
                    <TabsTrigger value="skipped">Skipped</TabsTrigger>
                  </TabsList>

                  {["all", "success", "error", "skipped"].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-4">
                      <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left">Row</th>
                              <th className="px-4 py-2 text-left">NIK</th>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Email</th>
                              <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResult.data.results
                              .filter(
                                (result) =>
                                  tab === "all" || result.status === tab
                              )
                              .map((result, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-4 py-2">
                                    {result.row_number}
                                  </td>
                                  <td className="px-4 py-2">{result.nik}</td>
                                  <td className="px-4 py-2">{result.name}</td>
                                  <td className="px-4 py-2">{result.email}</td>
                                  <td className="px-4 py-2">
                                    <Badge
                                      variant={
                                        result.status === "success"
                                          ? "default"
                                          : result.status === "error"
                                            ? "destructive"
                                            : "secondary"
                                      }
                                    >
                                      {result.status}
                                    </Badge>
                                    {result.error && (
                                      <div className="text-xs text-red-600 mt-1">
                                        {result.error.message}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              <div className="flex space-x-4">
                <Button variant="outline" onClick={resetUpload}>
                  Import Another File
                </Button>
                <Button onClick={() => (window.location.href = "/admin/users")}>
                  View Users
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
