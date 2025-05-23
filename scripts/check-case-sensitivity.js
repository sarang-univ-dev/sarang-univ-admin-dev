#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const glob = require("glob");

/**
 * 대소문자 일치성을 검증하는 스크립트
 * Vercel 빌드 환경에서 발생할 수 있는 Module not found 오류를 사전에 방지
 */

const srcDir = path.join(__dirname, "../src");
const errors = [];

// TypeScript/JavaScript 파일들을 찾기
const files = glob.sync("**/*.{ts,tsx,js,jsx}", { cwd: srcDir });

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  // @/ import 문들을 찾기
  const importRegex = /import\s+.*?\s+from\s+['"]@\/([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const actualPath = path.join(srcDir, importPath);

    // 확장자 추가 시도
    const possibleExtensions = ["", ".ts", ".tsx", ".js", ".jsx", ".json"];
    let foundPath = null;

    for (const ext of possibleExtensions) {
      const testPath = actualPath + ext;
      if (fs.existsSync(testPath)) {
        foundPath = testPath;
        break;
      }

      // index 파일 체크
      const indexPath = path.join(actualPath, "index" + ext);
      if (fs.existsSync(indexPath)) {
        foundPath = indexPath;
        break;
      }
    }

    if (!foundPath) {
      errors.push({
        file: file,
        importPath: `@/${importPath}`,
        error: "File not found",
      });
    } else {
      // 대소문자 정확성 체크
      const relativePath = path.relative(srcDir, foundPath);
      const normalizedImportPath = importPath.replace(/\\/g, "/");
      const normalizedFoundPath = relativePath
        .replace(/\\/g, "/")
        .replace(/\.(ts|tsx|js|jsx)$/, "");

      if (
        normalizedImportPath !== normalizedFoundPath &&
        normalizedImportPath !== normalizedFoundPath.replace(/\/index$/, "")
      ) {
        errors.push({
          file: file,
          importPath: `@/${importPath}`,
          expectedPath: `@/${normalizedFoundPath}`,
          error: "Case mismatch",
        });
      }
    }
  }
});

if (errors.length > 0) {
  console.error("❌ 대소문자 불일치 또는 누락된 파일이 발견되었습니다:");
  errors.forEach(error => {
    console.error(`\n파일: ${error.file}`);
    console.error(`Import: ${error.importPath}`);
    if (error.expectedPath) {
      console.error(`예상 경로: ${error.expectedPath}`);
    }
    console.error(`오류: ${error.error}`);
  });
  process.exit(1);
} else {
  console.log("✅ 모든 import 경로의 대소문자가 올바릅니다!");
}
