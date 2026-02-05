const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const baseSegment = path.basename(rootDir);
const blockedHost = "example" + ".com";
const issues = [];

const listingsPath = path.join(rootDir, "assets", "listings.json");
let listingIds = new Set();

try {
  const listings = JSON.parse(fs.readFileSync(listingsPath, "utf8"));
  listingIds = new Set(listings.map((item) => item.id));
} catch (err) {
  issues.push(`Unable to read listings.json: ${err.message}`);
}

const requiredListingIds = ["ml-1001", "ml-1002", "ml-1003", "ml-1004", "ml-1005", "ml-1006"];
requiredListingIds.forEach((id) => {
  if (!listingIds.has(id)) {
    issues.push(`Missing required listing id in listings.json: ${id}`);
  }
});

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

function extractAttributes(content, attr) {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "gi");
  const values = [];
  let match;
  while ((match = regex.exec(content))) {
    values.push(match[1]);
  }
  return values;
}

function isExternal(link) {
  return /^(https?:|mailto:|tel:|data:)/i.test(link);
}

function resolveTarget(filePath, link) {
  let clean = link.split("#")[0].split("?")[0];
  if (!clean) return null;

  if (clean.startsWith("/")) {
    if (!clean.startsWith(`/${baseSegment}/`) && clean !== `/${baseSegment}`) {
      return null;
    }
    clean = clean.replace(`/${baseSegment}`, "");
    if (clean === "") {
      clean = "/index.html";
    }
  }

  let target = clean.startsWith("/")
    ? path.join(rootDir, clean.slice(1))
    : path.join(path.dirname(filePath), clean);

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

function checkListingLink(link, filePath) {
  const match = link.match(/listing\/index\.html\?[^#]*\bid=([^&]+)/i);
  if (!match) return;
  const id = decodeURIComponent(match[1]);
  if (!listingIds.has(id)) {
    issues.push(`${filePath}: listing id not found -> ${id}`);
  }
}

const htmlFiles = walk(rootDir);

for (const filePath of htmlFiles) {
  const content = fs.readFileSync(filePath, "utf8");
  const links = extractAttributes(content, "href");
  const sources = extractAttributes(content, "src");

  [...links, ...sources].forEach((link) => {
    if (!link || link.trim() === "") {
      issues.push(`${filePath}: empty link attribute`);
      return;
    }
    if (link.includes(blockedHost)) {
      issues.push(`${filePath}: ${blockedHost} -> ${link}`);
      return;
    }
    if (link === "#") {
      issues.push(`${filePath}: placeholder link -> ${link}`);
      return;
    }
    if (link.startsWith("#")) {
      return;
    }
    if (isExternal(link)) {
      return;
    }

    checkListingLink(link, filePath);

    const resolved = resolveTarget(filePath, link);
    if (!resolved) {
      issues.push(`${filePath}: missing target -> ${link}`);
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
