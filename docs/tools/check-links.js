const fs = require("fs");
const path = require("path");

const docsDir = path.join(__dirname, "..");
const blockedHost = "example" + ".com";
const issues = [];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractLinks(content) {
  const links = [];
  const regex = /href\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(content))) {
    links.push(match[1]);
  }
  return links;
}

function resolveTarget(filePath, href) {
  const isAbsolute = href.startsWith("/");
  let clean = href.split("#")[0].split("?")[0];
  if (!clean) return null;
  if (clean.startsWith("/")) {
    clean = clean.slice(1);
  }
  let target = isAbsolute ? path.join(docsDir, clean) : path.join(path.dirname(filePath), clean);

  if (clean.endsWith("/")) {
    target = path.join(target, "index.html");
  }

  if (fs.existsSync(target)) return target;
  if (!path.extname(target)) {
    if (fs.existsSync(`${target}.html`)) return `${target}.html`;
    if (fs.existsSync(path.join(target, "index.html"))) return path.join(target, "index.html");
  }

  return null;
}

const htmlFiles = walk(docsDir);

for (const filePath of htmlFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  const links = extractLinks(content);

  links.forEach((href) => {
    if (!href || href.trim() === "") {
      issues.push(`${filePath}: empty href`);
      return;
    }
    if (href.includes(blockedHost)) {
      issues.push(`${filePath}: ${blockedHost} -> ${href}`);
      return;
    }
    if (href === "#") {
      issues.push(`${filePath}: empty hash -> ${href}`);
      return;
    }
    if (href.startsWith("#")) {
      return;
    }
    if (/^(https?:|mailto:|tel:)/i.test(href)) {
      return;
    }
    if (href.startsWith("javascript:")) {
      issues.push(`${filePath}: javascript href -> ${href}`);
      return;
    }

    const resolved = resolveTarget(filePath, href);
    if (!resolved) {
      issues.push(`${filePath}: missing target -> ${href}`);
    }
  });
}

if (issues.length > 0) {
  console.error("Broken or placeholder links found:");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
} else {
  console.log("Link check passed.");
}
