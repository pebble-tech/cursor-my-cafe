import Papa from 'papaparse';

import { UserType } from '@base/core/config/constant';

export type ParsedParticipant = {
  name: string;
  email: string;
  lumaId?: string;
  userType: UserType;
};

export type ParsedRow = {
  row: number;
  data: ParsedParticipant;
  valid: boolean;
  error?: string;
};

export type CSVParseResult = {
  success: boolean;
  rows: ParsedRow[];
  validCount: number;
  invalidCount: number;
  error?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseParticipantsCSV(csvContent: string): CSVParseResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: `CSV parsing error: ${result.errors[0].message}`,
    };
  }

  const headers = result.meta.fields?.map((f) => f.toLowerCase()) || [];

  if (!headers.includes('email')) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: 'Missing required column: email',
    };
  }

  if (!headers.includes('name')) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: 'Missing required column: name',
    };
  }

  const rows: ParsedRow[] = [];
  let validCount = 0;
  let invalidCount = 0;

  result.data.forEach((row, index) => {
    const email = (row['email'] || '').trim();
    const name = (row['name'] || '').trim();
    const lumaId =
      (row['luma_id'] || row['lumaid'] || row['api_id'] || row['apiid'] || '').trim() || undefined;
    const userTypeRaw = (row['user_type'] || row['usertype'] || row['type'] || 'regular').trim().toLowerCase();

    const parsedRow: ParsedRow = {
      row: index + 1,
      data: { name, email, lumaId, userType: 'regular' },
      valid: true,
    };

    if (!email) {
      parsedRow.valid = false;
      parsedRow.error = 'Email is required';
    } else if (!EMAIL_REGEX.test(email)) {
      parsedRow.valid = false;
      parsedRow.error = 'Invalid email format';
    } else if (!name) {
      parsedRow.valid = false;
      parsedRow.error = 'Name is required';
    } else if (!['regular', 'vip', 'ops', 'admin'].includes(userTypeRaw)) {
      parsedRow.valid = false;
      parsedRow.error = `Invalid user_type: ${userTypeRaw}`;
    } else {
      parsedRow.data.userType = userTypeRaw as UserType;
    }

    if (parsedRow.valid) {
      validCount++;
    } else {
      invalidCount++;
    }

    rows.push(parsedRow);
  });

  return {
    success: true,
    rows,
    validCount,
    invalidCount,
  };
}

export function generateSkippedRowsCSV(skippedRows: Array<{ row: number; email: string; reason: string }>): string {
  const data = skippedRows.map((r) => ({
    row: r.row,
    email: r.email,
    reason: r.reason,
  }));

  return Papa.unparse(data);
}

export type ParsedCode = {
  codeValue: string;
  redeemUrl?: string;
};

export type ParsedCodeRow = {
  row: number;
  data: ParsedCode;
  valid: boolean;
  error?: string;
};

export type CodeCSVParseResult = {
  success: boolean;
  rows: ParsedCodeRow[];
  validCount: number;
  invalidCount: number;
  error?: string;
};

export function parseCodesCSV(csvContent: string): CodeCSVParseResult {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: `CSV parsing error: ${result.errors[0].message}`,
    };
  }

  const headers = result.meta.fields?.map((f) => f.toLowerCase()) || [];

  if (!headers.includes('code')) {
    return {
      success: false,
      rows: [],
      validCount: 0,
      invalidCount: 0,
      error: 'Missing required column: code',
    };
  }

  const rows: ParsedCodeRow[] = [];
  let validCount = 0;
  let invalidCount = 0;
  const seenCodes = new Set<string>();

  result.data.forEach((row, index) => {
    const codeValue = (row['code'] || '').trim().toUpperCase();
    const redeemUrl = (row['redeem_url'] || row['redeem url'] || row['redeemurl'] || '').trim() || undefined;

    const parsedRow: ParsedCodeRow = {
      row: index + 1,
      data: { codeValue, redeemUrl },
      valid: true,
    };

    if (!codeValue) {
      parsedRow.valid = false;
      parsedRow.error = 'Code is required';
    } else if (seenCodes.has(codeValue)) {
      parsedRow.valid = false;
      parsedRow.error = 'Duplicate code in file';
    } else {
      seenCodes.add(codeValue);
    }

    if (parsedRow.valid) {
      validCount++;
    } else {
      invalidCount++;
    }

    rows.push(parsedRow);
  });

  return {
    success: true,
    rows,
    validCount,
    invalidCount,
  };
}

export function generateSkippedCodesCSV(skippedCodes: Array<{ codeValue: string; reason: string }>): string {
  const data = skippedCodes.map((c) => ({
    code: c.codeValue,
    reason: c.reason,
  }));

  return Papa.unparse(data);
}
