import {
  type BulkUserData,
  type BulkUserResult,
  BULK_CONSTANTS,
  BULK_ERROR_CODES,
  BulkUserDataSchema,
} from "shared-types";

// ==================== CSV PARSING ====================

interface CSVParseResult {
  success: boolean;
  data?: any[];
  error?: string;
  totalRows: number;
  headerRow?: number;
  dataStartRow?: number;
}

export function parseCSVContentSmart(csvContent: string): CSVParseResult {
  try {
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length === 0) {
      return {
        success: false,
        error: "Empty CSV file",
        totalRows: 0,
      };
    }

    // For this specific format, we know headers are on line 5 (index 4)
    let headerRowIndex = -1;
    let potentialHeaders: string[] = [];

    // Look for header row containing expected Syntegra headers
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const columns = parseCSVLine(lines[i]);

      // Check for Syntegra specific headers
      const hasSyntegraCols = columns.some((col) =>
        ["NAMA", "NIK KTP", "E-MAIL", "SEX", "NOMOR HP"].includes(col.trim())
      );

      if (hasSyntegraCols) {
        headerRowIndex = i;
        potentialHeaders = columns.map((col) => col.trim());
        break;
      }
    }

    if (headerRowIndex === -1) {
      return {
        success: false,
        error:
          "Could not find valid Syntegra header row. Expected headers: NAMA, NIK KTP, E-MAIL, SEX, NOMOR HP",
        totalRows: lines.length,
      };
    }

    // Parse data rows
    const dataRows = [];
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);

      // Skip completely empty rows
      if (columns.every((col) => col.trim() === "")) {
        continue;
      }

      const rowData: any = {};
      potentialHeaders.forEach((header, index) => {
        if (header !== "") {
          rowData[header] = columns[index] ? columns[index].trim() : "";
        }
      });

      // Only add row if it has some actual data
      const hasData = Object.values(rowData).some((val) => val !== "");
      if (hasData) {
        dataRows.push(rowData);
      }
    }

    return {
      success: true,
      data: dataRows,
      totalRows: lines.length,
      headerRow: headerRowIndex + 1,
      dataStartRow: headerRowIndex + 2,
    };
  } catch (error) {
    return {
      success: false,
      error: `CSV parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      totalRows: 0,
    };
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

// ==================== COLUMN DETECTION ====================

interface ColumnMappingResult {
  detectedMapping: Record<string, string>;
  missingColumns: string[];
  confidence: number;
}

export function detectSyntegraCSVColumns(
  headers: string[]
): ColumnMappingResult {
  const requiredFields = ["nik", "name", "email", "gender", "phone"];

  // Exact mapping for Syntegra CSV format
  const exactMapping: Record<string, string> = {
    nik: "NIK KTP",
    name: "NAMA",
    email: "E-MAIL",
    gender: "SEX",
    phone: "NOMOR HP",
    birth_place: "TEMPAT LAHIR",
    birth_date: "TANGGAL LAHIR",
    religion: "AGAMA",
    education: "PENDIDIKAN TERAKHIR",
    address: "ALAMAT KTP",
  };

  const detectedMapping: Record<string, string> = {};
  const missingColumns: string[] = [];
  let matchCount = 0;

  // Try exact matches first
  for (const [field, expectedHeader] of Object.entries(exactMapping)) {
    const foundHeader = headers.find((h) => h.trim() === expectedHeader);

    if (foundHeader) {
      detectedMapping[field] = foundHeader;
      if (requiredFields.includes(field)) {
        matchCount++;
      }
    } else if (requiredFields.includes(field)) {
      missingColumns.push(field);
    }
  }

  // Calculate confidence
  const confidence = matchCount / requiredFields.length;

  return {
    detectedMapping,
    missingColumns,
    confidence,
  };
}

// ==================== DATA TRANSFORMATION ====================

export function transformSyntegraCSVRowToBulkUser(
  row: Record<string, any>,
  columnMapping: Record<string, string>,
  rowNumber: number
): { success: boolean; data?: BulkUserData; error?: string } {
  try {
    // Map CSV columns to our fields
    const mappedData: Record<string, any> = {
      row_number: rowNumber,
    };

    // Required fields mapping
    mappedData.nik = row[columnMapping.nik] || "";
    mappedData.name = row[columnMapping.name] || "";
    mappedData.email = row[columnMapping.email] || "";
    mappedData.gender = normalizeSyntegraGender(row[columnMapping.gender]);
    mappedData.phone = normalizeSyntegraPhoneNumber(row[columnMapping.phone]);

    // Optional fields
    if (columnMapping.birth_place && row[columnMapping.birth_place]) {
      mappedData.birth_place = row[columnMapping.birth_place].trim();
    }

    if (columnMapping.birth_date && row[columnMapping.birth_date]) {
      mappedData.birth_date = normalizeSyntegraDate(
        row[columnMapping.birth_date]
      );
    }

    if (columnMapping.religion && row[columnMapping.religion]) {
      mappedData.religion = normalizeSyntegraReligion(
        row[columnMapping.religion]
      );
    }

    if (columnMapping.education && row[columnMapping.education]) {
      mappedData.education = normalizeSyntegraEducation(
        row[columnMapping.education]
      );
    }

    if (columnMapping.address && row[columnMapping.address]) {
      mappedData.address = row[columnMapping.address].trim();
    }

    // Validate against schema
    const result = BulkUserDataSchema.safeParse(mappedData);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errorMessages = result.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      return {
        success: false,
        error: `Validation failed: ${errorMessages.join(", ")}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Transformation error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// ==================== SYNTEGRA-SPECIFIC NORMALIZATION ====================

function normalizeSyntegraGender(value: any): string | undefined {
  if (!value) return undefined;

  const strValue = String(value).toLowerCase().trim();

  if (["l", "laki", "laki-laki", "male", "m"].includes(strValue)) {
    return "male";
  }

  if (["p", "perempuan", "female", "f"].includes(strValue)) {
    return "female";
  }

  return undefined;
}

function normalizeSyntegraPhoneNumber(value: any): string {
  if (!value) return "";

  let phone = String(value).trim();

  // Remove common formatting
  phone = phone.replace(/[-\s\(\)]/g, "");

  // Skip if empty after cleaning
  if (!phone) return "";

  // Convert to Indonesian format
  if (phone.startsWith("0")) {
    phone = "+62" + phone.substring(1);
  } else if (phone.startsWith("62")) {
    phone = "+" + phone;
  } else if (!phone.startsWith("+")) {
    phone = "+62" + phone;
  }

  return phone;
}

function normalizeSyntegraDate(value: any): string | undefined {
  if (!value) return undefined;

  try {
    const strValue = String(value).trim();

    // Common Indonesian date formats: DD/MM/YYYY
    if (strValue.includes("/")) {
      const parts = strValue.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];

        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    // Try direct date parsing
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function normalizeSyntegraReligion(value: any): string | undefined {
  if (!value) return undefined;

  const strValue = String(value).toLowerCase().trim();

  if (["islam", "muslim"].includes(strValue)) return "islam";
  if (
    ["kristen", "christian", "katolik", "catholic", "katholik"].includes(
      strValue
    )
  )
    return "christian";
  if (["budha", "buddha", "buddhist"].includes(strValue)) return "buddhist";
  if (["hindu"].includes(strValue)) return "hindu";
  if (["konghucu", "confucian"].includes(strValue)) return "confucian";

  return "other";
}

function normalizeSyntegraEducation(value: any): string | undefined {
  if (!value) return undefined;

  const strValue = String(value).toLowerCase().trim();

  if (["sd", "sekolah dasar"].includes(strValue)) return "elementary";
  if (["smp", "sekolah menengah pertama"].includes(strValue))
    return "junior_high";
  if (
    [
      "sma",
      "smk",
      "slta",
      "sekolah menengah atas",
      "sekolah menengah kejuruan",
    ].includes(strValue)
  )
    return "senior_high";
  if (["d1", "diploma 1"].includes(strValue)) return "diploma_1";
  if (["d2", "diploma 2"].includes(strValue)) return "diploma_2";
  if (["d3", "diploma 3"].includes(strValue)) return "diploma_3";
  if (["d4", "diploma 4"].includes(strValue)) return "diploma_4";
  if (["s1", "sarjana", "bachelor"].includes(strValue)) return "bachelor";
  if (["s2", "magister", "master"].includes(strValue)) return "master";
  if (["s3", "doktor", "doctor", "phd"].includes(strValue)) return "doctorate";

  return "other";
}

// ==================== VALIDATION ====================

export function validateBulkUserData(users: BulkUserData[]) {
  const results: BulkUserResult[] = [];
  let validRows = 0;
  let invalidRows = 0;
  const seenNiks = new Set<string>();
  const seenEmails = new Set<string>();
  let duplicateNiks = 0;
  let duplicateEmails = 0;

  for (const user of users) {
    const rowNumber = user.row_number || 0;

    // Check for duplicate NIK
    if (seenNiks.has(user.nik)) {
      duplicateNiks++;
      results.push({
        row_number: rowNumber,
        nik: user.nik,
        name: user.name,
        email: user.email,
        status: "error",
        error: {
          field: "nik",
          message: "Duplicate NIK found in CSV file",
          code: BULK_ERROR_CODES.DUPLICATE_NIK,
        },
      });
      invalidRows++;
      continue;
    }
    seenNiks.add(user.nik);

    // Check for duplicate email (if email exists)
    if (user.email && seenEmails.has(user.email)) {
      duplicateEmails++;
      results.push({
        row_number: rowNumber,
        nik: user.nik,
        name: user.name,
        email: user.email,
        status: "error",
        error: {
          field: "email",
          message: "Duplicate email found in CSV file",
          code: BULK_ERROR_CODES.DUPLICATE_EMAIL,
        },
      });
      invalidRows++;
      continue;
    }

    if (user.email) {
      seenEmails.add(user.email);
    }

    // Validate individual user data
    const validation = BulkUserDataSchema.safeParse(user);

    if (validation.success) {
      results.push({
        row_number: rowNumber,
        nik: user.nik,
        name: user.name,
        email: user.email,
        status: "success",
      });
      validRows++;
    } else {
      const errorMessages = validation.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      results.push({
        row_number: rowNumber,
        nik: user.nik,
        name: user.name,
        email: user.email,
        status: "error",
        error: {
          message: errorMessages.join(", "),
          code: BULK_ERROR_CODES.VALIDATION_FAILED,
        },
      });
      invalidRows++;
    }
  }

  return {
    validRows,
    invalidRows,
    duplicateNiks,
    duplicateEmails,
    results,
  };
}
