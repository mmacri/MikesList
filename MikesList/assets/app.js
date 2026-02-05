const BASE_PATH = "/MikesList";
const ADMIN_EMAIL = "mikeslist@yourdomain.com"; // Change to your admin inbox
const APP_URL = "";

function withBase(path) {
  if (!path) return BASE_PATH;
  if (path.startsWith(BASE_PATH)) return path;
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${clean}`;
}

function slugToLabel(slug) {
  if (!slug) return "";
  const parts = slug.split("-").map((part) => {
    if (part.length === 2) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  return parts.join(" ");
}

function parseTagsParam(values) {
  const list = [];
  values.forEach((value) => {
    if (!value) return;
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => list.push(item));
  });
  return Array.from(new Set(list));
}

function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const tagValues = params.getAll("tags").concat(params.getAll("tag"));
  const page = Number.parseInt(params.get("page") || "1", 10);
  return {
    q: params.get("q") || "",
    category: params.get("category") || "",
    location: params.get("location") || "",
    tags: parseTagsParam(tagValues),
    sort: params.get("sort") || "newest",
    page: Number.isNaN(page) ? 1 : page
  };
}

function updateURLFromState(state) {
  const params = new URLSearchParams();
  if (state.category) params.set("category", state.category);
  if (state.location) params.set("location", state.location);
  if (state.q) params.set("q", state.q);
  if (state.tags && state.tags.length > 0) {
    params.set("tags", state.tags.join(","));
  }
  if (state.sort && state.sort !== "newest") {
    params.set("sort", state.sort);
  }
  const query = params.toString();
  const base = window.location.pathname;
  window.history.replaceState({}, "", query ? `${base}?${query}` : base);
}

function applyFilters(listings, state) {
  const search = state.q.trim().toLowerCase();
  const tags = state.tags || [];

  return listings.filter((listing) => {
    if (state.category && listing.categorySlug !== state.category) {
      return false;
    }
    if (state.location && listing.locationSlug !== state.location) {
      return false;
    }
    if (tags.length > 0) {
      const hasAll = tags.every((tag) => listing.tags.includes(tag));
      if (!hasAll) return false;
    }
    if (search) {
      const haystack = `${listing.title} ${listing.description} ${listing.category} ${listing.locationLabel} ${listing.tags.join(" ")}`
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function scoreListing(listing, state) {
  const query = state.q.trim().toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);
  const title = listing.title.toLowerCase();
  const description = listing.description.toLowerCase();
  let score = 0;

  terms.forEach((term) => {
    if (title.includes(term)) score += 3;
    if (description.includes(term)) score += 1;
  });

  if (state.tags && state.tags.length > 0) {
    state.tags.forEach((tag) => {
      if (listing.tags.includes(tag)) score += 2;
    });
  }

  return score;
}

function sortListings(listings, state) {
  const sorted = listings.slice();
  const sortMode = state.sort || "newest";

  if (sortMode === "relevant" && (state.q || (state.tags && state.tags.length > 0))) {
    sorted.sort((a, b) => {
      const scoreA = scoreListing(a, state);
      const scoreB = scoreListing(b, state);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return Date.parse(b.updatedISO) - Date.parse(a.updatedISO);
    });
    return sorted;
  }

  sorted.sort((a, b) => Date.parse(b.updatedISO) - Date.parse(a.updatedISO));
  return sorted;
}

function formatTagChips(tags, max = 4) {
  const wrapper = document.createElement("div");
  wrapper.className = "tag-chip-list";
  const limited = tags.slice(0, max);
  limited.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "tag-chip";
    chip.textContent = tag;
    wrapper.appendChild(chip);
  });
  if (tags.length > max) {
    const extra = document.createElement("span");
    extra.className = "tag-chip";
    extra.textContent = `+${tags.length - max}`;
    wrapper.appendChild(extra);
  }
  return wrapper;
}

function buildSnippet(text, limit = 120) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  return `${flat.slice(0, limit - 3)}...`;
}

function renderEmptyState(container, state) {
  container.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.innerHTML = "<p>No listings match these filters.</p><p class=\"small\">Try removing tags or broadening your search.</p>";
  if (state.tags && state.tags.length > 0) {
    const tags = document.createElement("p");
    tags.className = "small";
    tags.textContent = `Active tags: ${state.tags.join(", ")}`;
    empty.appendChild(tags);
  }
  container.appendChild(empty);
}

function renderListingRows(container, listings, options = {}) {
  container.innerHTML = "";

  if (options.countEl) {
    options.countEl.textContent = `${listings.length} result${listings.length === 1 ? "" : "s"}`;
  }

  if (listings.length === 0) {
    renderEmptyState(container, options.state || {});
    return;
  }

  const list = document.createElement("ul");
  list.className = "listing-list";

  listings.forEach((listing) => {
    const row = document.createElement("li");
    row.className = "listing-row";

    const link = document.createElement("a");
    link.className = "listing-link";
    link.href = `${withBase("/listing/index.html")}?id=${encodeURIComponent(listing.id)}`;
    link.textContent = listing.title;

    const meta = document.createElement("div");
    meta.className = "listing-secondary";
    meta.textContent = `${listing.locationLabel} • ${listing.category} • ${listing.updatedLabel}`;

    const snippet = document.createElement("div");
    snippet.className = "listing-snippet";
    snippet.textContent = buildSnippet(listing.description);

    row.appendChild(link);
    row.appendChild(meta);
    row.appendChild(snippet);
    row.appendChild(formatTagChips(listing.tags));
    list.appendChild(row);
  });

  container.appendChild(list);
}

function loadListings() {
  return fetch(withBase("/assets/listings.json")).then((response) => {
    if (!response.ok) {
      throw new Error("Unable to load listings");
    }
    return response.json();
  });
}

function renderNewestListings(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  loadListings()
    .then((listings) => {
      const sorted = sortListings(listings, { sort: "newest", q: "", tags: [] });
      renderListingRows(container, sorted.slice(0, count));
    })
    .catch(() => {
      container.innerHTML = "<p class=\"small\">Unable to load listings.</p>";
    });
}

function getUniqueTags(listings) {
  const tags = new Set();
  listings.forEach((listing) => {
    listing.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

function renderTagOptions(container, tags, selected) {
  container.innerHTML = "";
  tags.forEach((tag) => {
    const label = document.createElement("label");
    label.className = "tag-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "tag";
    input.value = tag;
    if (selected.includes(tag)) {
      input.checked = true;
    }
    label.appendChild(input);
    label.appendChild(document.createTextNode(tag));
    container.appendChild(label);
  });
}

function buildSummary(state, total, lookups) {
  const parts = [`Showing ${total} result${total === 1 ? "" : "s"}`];
  if (state.category) {
    parts.push(lookups.category[state.category] || slugToLabel(state.category));
  }
  if (state.location) {
    parts.push(lookups.location[state.location] || slugToLabel(state.location));
  }
  if (state.tags && state.tags.length > 0) {
    parts.push(`Tags: ${state.tags.join(", ")}`);
  }
  if (state.q) {
    parts.push(`Search: "${state.q}"`);
  }
  if (state.sort && state.sort !== "newest") {
    parts.push("Sorted by relevance");
  }
  return parts.join(" • ");
}

function initFiltersToggle(buttonId, panelId) {
  const button = document.getElementById(buttonId);
  const panel = document.getElementById(panelId);
  if (!button || !panel) return;

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
  }

  button.addEventListener("click", () => {
    setOpen(!panel.classList.contains("is-open"));
  });
}

function initDirectoryPage(config) {
  const categorySelect = config.categorySelectId ? document.getElementById(config.categorySelectId) : null;
  const locationSelect = config.locationSelectId ? document.getElementById(config.locationSelectId) : null;
  const searchInput = config.searchInputId ? document.getElementById(config.searchInputId) : null;
  const sortSelect = config.sortSelectId ? document.getElementById(config.sortSelectId) : null;
  const tagContainer = config.tagContainerId ? document.getElementById(config.tagContainerId) : null;
  const resultsContainer = document.getElementById(config.resultsContainerId);
  const countEl = config.countId ? document.getElementById(config.countId) : null;
  const summaryEl = config.summaryId ? document.getElementById(config.summaryId) : null;
  const clearButton = config.clearButtonId ? document.getElementById(config.clearButtonId) : null;

  if (!resultsContainer) return;

  const query = parseQueryParams();
  const state = {
    category: config.categorySlug || query.category || "",
    location: config.locationSlug || query.location || "",
    q: query.q || "",
    tags: query.tags || [],
    sort: query.sort || "newest"
  };

  if (categorySelect && state.category) categorySelect.value = state.category;
  if (locationSelect && state.location) locationSelect.value = state.location;
  if (searchInput && state.q) searchInput.value = state.q;
  if (sortSelect && state.sort) sortSelect.value = state.sort;

  let listingsCache = [];
  let lookups = { category: {}, location: {} };

  function getTagInputs() {
    if (config.tagSelector) {
      return Array.from(document.querySelectorAll(config.tagSelector));
    }
    if (tagContainer) {
      return Array.from(tagContainer.querySelectorAll('input[type="checkbox"]'));
    }
    return [];
  }

  function readFilters() {
    const tagInputs = getTagInputs();
    const selectedTags = tagInputs.filter((input) => input.checked).map((input) => input.value);

    return {
      category: config.categorySlug || (categorySelect ? categorySelect.value : ""),
      location: config.locationSlug || (locationSelect ? locationSelect.value : ""),
      q: searchInput ? searchInput.value : "",
      tags: selectedTags,
      sort: sortSelect ? sortSelect.value : "newest"
    };
  }

  function update() {
    const filters = readFilters();
    const filtered = applyFilters(listingsCache, filters);
    const sorted = sortListings(filtered, filters);
    renderListingRows(resultsContainer, sorted, { countEl, state: filters });
    if (summaryEl) {
      summaryEl.textContent = buildSummary(filters, sorted.length, lookups);
    }
    if (config.syncUrl) {
      updateURLFromState(filters);
    }
  }

  function clearFilters() {
    if (categorySelect && !config.categorySlug) categorySelect.value = "";
    if (locationSelect && !config.locationSlug) locationSelect.value = "";
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "newest";
    getTagInputs().forEach((input) => {
      input.checked = false;
    });
    update();
  }

  loadListings()
    .then((listings) => {
      listingsCache = listings;
      lookups = {
        category: listingsCache.reduce((acc, item) => {
          acc[item.categorySlug] = item.category;
          return acc;
        }, {}),
        location: listingsCache.reduce((acc, item) => {
          acc[item.locationSlug] = item.locationLabel;
          return acc;
        }, {})
      };
      if (tagContainer) {
        const allTags = getUniqueTags(listingsCache);
        renderTagOptions(tagContainer, allTags, state.tags);
      }
      update();
    })
    .catch(() => {
      resultsContainer.innerHTML = "<p class=\"small\">Unable to load listings right now.</p>";
    });

  [categorySelect, locationSelect, searchInput, sortSelect].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });

  document.addEventListener("change", (event) => {
    if (event.target && event.target.matches && event.target.matches(config.tagSelector || "#tag-options input[type='checkbox']")) {
      update();
    }
  });

  if (clearButton) {
    clearButton.addEventListener("click", (event) => {
      event.preventDefault();
      clearFilters();
    });
  }

  if (config.filtersToggleButtonId && config.filtersPanelId) {
    initFiltersToggle(config.filtersToggleButtonId, config.filtersPanelId);
  }
}

window.MikesList = {
  BASE_PATH,
  ADMIN_EMAIL,
  APP_URL,
  slugToLabel,
  loadListings,
  renderListingRows,
  applyFilters,
  parseQueryParams,
  updateURLFromState,
  renderNewestListings,
  initDirectoryPage
};
