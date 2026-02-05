window.APP_BASE_URL = "https://your-app-domain.com";

function normalizeBase(url) {
  return url.replace(/\/$/, "");
}

function withBase(path) {
  return `${normalizeBase(window.APP_BASE_URL)}${path}`;
}

function applyAppLinks() {
  const links = document.querySelectorAll("[data-app-link]");
  links.forEach((link) => {
    const path = link.getAttribute("data-app-link");
    if (!path) return;
    link.setAttribute("href", withBase(path));
  });
}

function initExampleSearch() {
  const input = document.getElementById("example-search");
  if (!input) return;
  const rows = Array.from(document.querySelectorAll("[data-example-row]"));

  function applyFilter() {
    const term = input.value.trim().toLowerCase();
    rows.forEach((row) => {
      const haystack = (row.getAttribute("data-search") || "").toLowerCase();
      if (!term || haystack.includes(term)) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }

  input.addEventListener("input", applyFilter);
}

document.addEventListener("DOMContentLoaded", () => {
  applyAppLinks();
  initExampleSearch();
});
