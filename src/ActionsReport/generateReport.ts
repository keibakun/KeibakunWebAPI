import * as fs from "fs";
import * as path from "path";

/**
 * ActionsReport 用の index.html (JSON) を生成するスクリプト
 *
 * Usage:
 *   npx tsx src/ActionsReport/generateReport.ts <workflowName> <code> <contents>
 *
 * - workflowName : ワークフロー名（ディレクトリ名として使用）
 * - code         : 0 = 正常終了, 1 = 異常終了
 * - contents     : レポートに含めるメッセージ
 */

const workflowName = process.argv[2];
const code = parseInt(process.argv[3], 10);
const contents = process.argv[4] ?? (code === 0 ? "Actions Complete" : "Unknown error");

if (!workflowName) {
  console.error("Error: workflowName is required");
  process.exit(1);
}

// TimeStamp を yyyyMMddhhmm 形式で生成（UTC）
const now = new Date();
const pad = (n: number) => n.toString().padStart(2, "0");
const timestamp = [
  now.getFullYear(),
  pad(now.getMonth() + 1),
  pad(now.getDate()),
  pad(now.getHours()),
  pad(now.getMinutes()),
].join("");

const report = {
  TimeStamp: timestamp,
  Code: code,
  Contents: contents,
};

const outDir = path.join("ActionsReport", workflowName);
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "index.html");
fs.writeFileSync(outPath, JSON.stringify(report));

console.log(`Report written to ${outPath}`);
console.log(JSON.stringify(report, null, 2));
