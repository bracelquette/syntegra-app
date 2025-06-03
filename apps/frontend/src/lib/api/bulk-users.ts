import type {
  ExcelUploadRequest,
  ExcelValidationResponse,
  BulkCreateUsersRequest,
  BulkCreateUsersResponse,
  ErrorResponse,
} from "shared-types";

// API Base Configuration
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-api-domain.com/api/v1"
    : "http://localhost:8787/api/v1";

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

// Create headers with auth
function createHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Handle API response
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ErrorResponse;
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return data;
}

// Bulk Users API Functions
export const bulkUsersApi = {
  /**
   * Validate Excel file for bulk user import
   */
  validateExcel: async (
    request: ExcelUploadRequest
  ): Promise<ExcelValidationResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/bulk/validate-excel`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse<ExcelValidationResponse>(response);
  },

  /**
   * Create users from Excel file
   */
  createFromExcel: async (
    request: ExcelUploadRequest
  ): Promise<BulkCreateUsersResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/bulk/excel`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse<BulkCreateUsersResponse>(response);
  },

  /**
   * Create users from JSON array
   */
  createFromJSON: async (
    request: BulkCreateUsersRequest
  ): Promise<BulkCreateUsersResponse> => {
    const response = await fetch(`${API_BASE_URL}/users/bulk/json`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse<BulkCreateUsersResponse>(response);
  },
};

// File Processing Utilities
export const fileUtils = {
  /**
   * Convert file to base64 string
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Validate file type
   */
  validateFileType: (fileName: string): boolean => {
    const allowedExtensions = [".xlsx", ".xls"];
    const extension = fileName
      .toLowerCase()
      .substring(fileName.lastIndexOf("."));
    return allowedExtensions.includes(extension);
  },

  /**
   * Validate file size (10MB limit)
   */
  validateFileSize: (fileSize: number): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return fileSize <= maxSize;
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Generate CSV template for download
   */
  generateCSVTemplate: (): void => {
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
      [
        "1234567890123457",
        "Jane Smith",
        "jane@example.com",
        "P",
        "+628987654321",
        "Bandung",
        "1992-05-15",
        "Kristen",
        "S1",
        "Jl. Asia Afrika No. 456",
        "Jawa Barat",
        "Bandung",
        "Sumur Bandung",
        "Braga",
        "40111",
      ],
    ];

    const csvContent = [headers, ...sampleData]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk_users_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Generate Excel template for download
   */
  generateExcelTemplate: (): void => {
    // Since we're in browser environment, we'll provide CSV template
    // For Excel template, you might want to use a library like xlsx
    fileUtils.generateCSVTemplate();
  },
};

// React Query Hooks
export const useBulkUsersQueries = () => {
  return {
    validateExcel: (request: ExcelUploadRequest) => ({
      queryKey: ["bulk-users", "validate-excel", request.file_name],
      queryFn: () => bulkUsersApi.validateExcel(request),
      enabled: false, // Manual trigger
    }),

    createFromExcel: (request: ExcelUploadRequest) => ({
      queryKey: ["bulk-users", "create-excel", request.file_name],
      queryFn: () => bulkUsersApi.createFromExcel(request),
      enabled: false, // Manual trigger
    }),

    createFromJSON: (request: BulkCreateUsersRequest) => ({
      queryKey: ["bulk-users", "create-json"],
      queryFn: () => bulkUsersApi.createFromJSON(request),
      enabled: false, // Manual trigger
    }),
  };
};

// Error handling utilities
export const apiErrorUtils = {
  /**
   * Extract error message from API response
   */
  getErrorMessage: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "An unexpected error occurred";
  },

  /**
   * Check if error is authentication related
   */
  isAuthError: (error: unknown): boolean => {
    if (error instanceof Error) {
      return (
        error.message.includes("401") ||
        error.message.includes("unauthorized") ||
        error.message.includes("Authentication required")
      );
    }
    return false;
  },

  /**
   * Check if error is permission related
   */
  isPermissionError: (error: unknown): boolean => {
    if (error instanceof Error) {
      return (
        error.message.includes("403") ||
        error.message.includes("forbidden") ||
        error.message.includes("Access denied")
      );
    }
    return false;
  },
};

// Storage utilities for temporary data
export const tempStorageUtils = {
  /**
   * Store validation result temporarily
   */
  storeValidationResult: (result: ExcelValidationResponse): void => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bulk_validation_result", JSON.stringify(result));
    }
  },

  /**
   * Get stored validation result
   */
  getValidationResult: (): ExcelValidationResponse | null => {
    if (typeof window === "undefined") return null;

    const stored = sessionStorage.getItem("bulk_validation_result");
    return stored ? JSON.parse(stored) : null;
  },

  /**
   * Clear stored validation result
   */
  clearValidationResult: (): void => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bulk_validation_result");
    }
  },

  /**
   * Store upload progress
   */
  storeUploadProgress: (progress: number): void => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bulk_upload_progress", progress.toString());
    }
  },

  /**
   * Get upload progress
   */
  getUploadProgress: (): number => {
    if (typeof window === "undefined") return 0;

    const stored = sessionStorage.getItem("bulk_upload_progress");
    return stored ? parseInt(stored, 10) : 0;
  },

  /**
   * Clear upload progress
   */
  clearUploadProgress: (): void => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("bulk_upload_progress");
    }
  },
};
