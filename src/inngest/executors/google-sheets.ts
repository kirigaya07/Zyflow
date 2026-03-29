import { google } from "googleapis";
import { clerkClient } from "@clerk/nextjs/server";
import { interpolate } from "../expressions";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */

async function getSheetsClient(userId: string) {
  const clerk = await clerkClient();
  const tokens = await clerk.users.getUserOauthAccessToken(userId, "google");
  const token = tokens.data?.[0]?.token;
  if (!token) return null;

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI
  );
  oauth2.setCredentials({ access_token: token });
  return google.sheets({ version: "v4", auth: oauth2 });
}

/** Accept either a full Google Sheets URL or a bare spreadsheet ID. */
function parseSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

/**
 * Parse a "values" string into a 2-D array.
 * Accepts:
 *  - JSON 2-D array: [["a","b"],["c","d"]]
 *  - JSON 1-D array: ["a","b","c"]
 *  - Comma-separated:  a, b, c
 */
function parseValues(raw: string): string[][] {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && Array.isArray(parsed[0])) {
        return (parsed as unknown[][]).map((row) => row.map(String));
      }
      return [(parsed as unknown[]).map(String)];
    }
  } catch {}
  return [trimmed.split(",").map((v) => v.trim())];
}

/* ──────────────────────────────────────────────────────────
   Executor
────────────────────────────────────────────────────────── */

export class GoogleSheetsExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;
    const operation = (metadata.operation as string) || "append";

    const sheets = await getSheetsClient(ctx.userId);
    if (!sheets) {
      return [{ json: { skipped: true, reason: "Google account not connected or missing Sheets scope" } }];
    }

    /* ── Create Spreadsheet ──────────────────────────────── */
    if (operation === "create") {
      const title = interpolate(
        (metadata.sheetTitle as string) || "New Spreadsheet",
        ctx.nodeOutputs,
        ctx.triggerPayload
      );
      const res = await sheets.spreadsheets.create({
        requestBody: { properties: { title } },
      });
      return [{
        json: {
          spreadsheetId: res.data.spreadsheetId,
          url: res.data.spreadsheetUrl,
          title,
        },
      }];
    }

    /* ── All other operations need a spreadsheet ID ──────── */
    const rawId = interpolate(
      (metadata.spreadsheetId as string) || "",
      ctx.nodeOutputs,
      ctx.triggerPayload
    );
    const spreadsheetId = parseSpreadsheetId(rawId);
    if (!spreadsheetId) {
      return [{ json: { skipped: true, reason: "No spreadsheet ID or URL configured" } }];
    }

    const range = (metadata.range as string) || "Sheet1";

    /* ── Append Row ─────────────────────────────────────── */
    if (operation === "append") {
      const rawValues = interpolate(
        (metadata.values as string) || "",
        ctx.nodeOutputs,
        ctx.triggerPayload
      );
      const values = parseValues(rawValues);
      const res = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values },
      });
      return [{
        json: {
          success: true,
          updatedRange: res.data.updates?.updatedRange,
          updatedRows: res.data.updates?.updatedRows,
        },
      }];
    }

    /* ── Get Rows ───────────────────────────────────────── */
    if (operation === "get") {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      const rows: string[][] = (res.data.values as string[][]) ?? [];
      if (rows.length === 0) return [{ json: { rows: [], count: 0 } }];

      const hasHeaders = metadata.hasHeaders !== false;
      if (hasHeaders) {
        const headerRow = rows[0];
        const records = rows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headerRow.forEach((h, i) => { obj[h] = row[i] ?? ""; });
          return { json: obj };
        });
        return records.length > 0 ? records : [{ json: { rows: [], count: 0 } }];
      }
      return [{ json: { rows, count: rows.length } }];
    }

    /* ── Update Row ─────────────────────────────────────── */
    if (operation === "update") {
      const rawValues = interpolate(
        (metadata.values as string) || "",
        ctx.nodeOutputs,
        ctx.triggerPayload
      );
      const values = parseValues(rawValues);
      const res = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { range, majorDimension: "ROWS", values },
      });
      return [{
        json: {
          success: true,
          updatedRange: res.data.updatedRange,
          updatedCells: res.data.updatedCells,
        },
      }];
    }

    /* ── Find Row ───────────────────────────────────────── */
    if (operation === "find") {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
      const rows: string[][] = (res.data.values as string[][]) ?? [];
      if (rows.length === 0) return [{ json: { found: false, rows: [] } }];

      const hasHeaders = metadata.hasHeaders !== false;
      const headerRow = hasHeaders ? rows[0] : null;
      const dataRows = hasHeaders ? rows.slice(1) : rows;

      const searchColumn = (metadata.searchColumn as string) || "";
      const searchValue = interpolate(
        (metadata.searchValue as string) || "",
        ctx.nodeOutputs,
        ctx.triggerPayload
      );
      const colIndex = headerRow
        ? headerRow.findIndex((h) => h.toLowerCase() === searchColumn.toLowerCase())
        : parseInt(searchColumn, 10) || 0;

      const matched = dataRows
        .map((row, i) => ({ row, rowNumber: i + (hasHeaders ? 2 : 1) }))
        .filter(({ row }) =>
          (row[colIndex] ?? "").toLowerCase() === searchValue.toLowerCase()
        );

      if (matched.length === 0) return [{ json: { found: false } }];

      return matched.map(({ row, rowNumber }) => {
        const obj: Record<string, unknown> = { _rowNumber: rowNumber };
        if (headerRow) {
          headerRow.forEach((h, i) => { obj[h] = row[i] ?? ""; });
        } else {
          row.forEach((v, i) => { obj[`col${i}`] = v; });
        }
        return { json: { found: true, ...obj } };
      });
    }

    /* ── Clear Range ────────────────────────────────────── */
    if (operation === "clear") {
      await sheets.spreadsheets.values.clear({ spreadsheetId, range });
      return [{ json: { success: true, clearedRange: range } }];
    }

    /* ── Delete Row ─────────────────────────────────────── */
    if (operation === "delete_row") {
      const rowNumber = parseInt(
        interpolate(
          (metadata.rowNumber as string) || "2",
          ctx.nodeOutputs,
          ctx.triggerPayload
        ),
        10
      );
      // Get the sheet ID (first sheet by default or look up by name)
      const sheetName = range.includes("!") ? range.split("!")[0] : range;
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheet = meta.data.sheets?.find(
        (s) => s.properties?.title === sheetName
      ) ?? meta.data.sheets?.[0];
      const sheetId = sheet?.properties?.sheetId ?? 0;

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,  // 0-indexed
                endIndex: rowNumber,
              },
            },
          }],
        },
      });
      return [{ json: { success: true, deletedRow: rowNumber } }];
    }

    return [{ json: { skipped: true, reason: `Unknown operation: ${operation}` } }];
  }
}
