const fs = require("fs");
const path = require("path");

const OUTPUT_FILE = "project-code.txt";
const targetExtensions = [".js", ".jsx", ".ts", ".tsx", ".json", ".css"];

function readFilesRecursively(dir, output = []) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      if (item === "node_modules" || item.startsWith(".")) return;
      readFilesRecursively(fullPath, output);
    } else {
      const ext = path.extname(item);
      if (targetExtensions.includes(ext)) {
        const content = fs.readFileSync(fullPath, "utf8");
        const relativePath = path.relative(__dirname, fullPath);
        output.push(`${relativePath}\n${content}\n`);
      }
    }
  });

  return output;
}

const result = readFilesRecursively(__dirname);
fs.writeFileSync(OUTPUT_FILE, result.join("\n"), "utf8");

console.log(`✅ All code exported to ${OUTPUT_FILE}`);
