import fs from "fs";
import path from "path";
import clipboardy from "clipboardy";

// 스캔할 디렉토리 배열을 만듭니다.
const directoriesToScan = [
  path.join(process.cwd(), "app/"),
  path.join(process.cwd(), "components/"),
];

// 지원하는 파일 확장자
const supportedExtensions = [".tsx"];

// 디렉토리의 파일을 재귀적으로 읽는 함수
function readFilesRecursively(dir) {
  let fileList = [];

  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fileList = fileList.concat(readFilesRecursively(filePath));
    } else if (supportedExtensions.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// 디렉토리에서 모든 파일을 가져옵니다.
let files = [];
directoriesToScan.forEach(directory => {
  files = files.concat(readFilesRecursively(directory));
});

// 클립보드에 복사할 문자열을 만듭니다.
let clipboardContent = "";

files.forEach(file => {
  const content = fs.readFileSync(file, "utf-8");
  const relativePath = path.relative(process.cwd(), file);
  clipboardContent += `/* File: ${relativePath} */\n${content}\n\n`;
});

// 클립보드에 복사
clipboardy.writeSync(clipboardContent);

console.log(`Copied ${files.length} files to the clipboard!`);
