const ADMIN_EMAIL = "admin@mikeslist.com";
const APP_URL = "";

function getBasePath() {
  if (window.location.protocol === "file:") {
    return "";
  }
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  return `/${parts[0]}`;
}

function withBase(path) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${getBasePath()}${clean}`;
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
  return {
    q: params.get("q") || "",
    category: params.get("category") || "",
    location: params.get("location") || "",
    tags: parseTagsParam(tagValues)
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

function renderListings(container, listings, countEl) {
  container.innerHTML = "";

  if (countEl) {
    countEl.textContent = `${listings.length} result${listings.length === 1 ? "" : "s"}`;
  }

  if (listings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "small";
    empty.textContent = "No listings match these filters.";
    container.appendChild(empty);
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
    meta.textContent = `${listing.locationLabel} | ${listing.category} | Updated ${listing.updatedLabel}`;

    const tags = document.createElement("div");
    tags.className = "tag-chip-list";
    listing.tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.textContent = tag;
      tags.appendChild(chip);
    });

    row.appendChild(link);
    row.appendChild(meta);
    row.appendChild(tags);
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

function parseUpdatedLabel(label) {
  if (!label) return 0;
  const parts = label.split(" ");
  if (parts.length < 2) return 0;
  const month = parts[0].toLowerCase();
  const day = parseInt(parts[1], 10);
  const months = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };
  if (Number.isNaN(day) || months[month] === undefined) return 0;
  const year = new Date().getFullYear();
  return new Date(year, months[month], day).getTime();
}

function renderNewestListings(containerId, count) {
  const container = document.getElementById(containerId);
  if (!container) return;
  loadListings()
    .then((listings) => {
      const sorted = listings
        .slice()
        .sort((a, b) => parseUpdatedLabel(b.updatedLabel) - parseUpdatedLabel(a.updatedLabel));
      renderListings(container, sorted.slice(0, count));
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
  const tagContainer = config.tagContainerId ? document.getElementById(config.tagContainerId) : null;
  const resultsContainer = document.getElementById(config.resultsContainerId);
  const countEl = config.countId ? document.getElementById(config.countId) : null;
  const clearButton = config.clearButtonId ? document.getElementById(config.clearButtonId) : null;

  if (!resultsContainer) return;

  const query = parseQueryParams();
  const state = {
    category: query.category || config.categorySlug || "",
    location: query.location || config.locationSlug || "",
    q: query.q || "",
    tags: query.tags || []
  };

  if (categorySelect && state.category) {
    categorySelect.value = state.category;
  }
  if (locationSelect && state.location) {
    locationSelect.value = state.location;
  }
  if (searchInput && state.q) {
    searchInput.value = state.q;
  }

  let listingsCache = [];

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
      category: categorySelect ? categorySelect.value : config.categorySlug || "",
      location: locationSelect ? locationSelect.value : config.locationSlug || "",
      q: searchInput ? searchInput.value : "",
      tags: selectedTags
    };
  }

  function update() {
    const filters = readFilters();
    const filtered = applyFilters(listingsCache, filters);
    renderListings(resultsContainer, filtered, countEl);
    if (config.syncUrl) {
      updateURLFromState(filters);
    }
  }

  function clearFilters() {
    if (categorySelect && !config.categorySlug) categorySelect.value = "";
    if (locationSelect && !config.locationSlug) locationSelect.value = "";
    if (searchInput) searchInput.value = "";
    getTagInputs().forEach((input) => {
      input.checked = false;
    });
    update();
  }

  loadListings()
    .then((listings) => {
      listingsCache = listings;
      if (tagContainer) {
        const allTags = getUniqueTags(listingsCache);
        renderTagOptions(tagContainer, allTags, state.tags);
      }
      update();
    })
    .catch(() => {
      resultsContainer.innerHTML = "<p class=\"small\">Unable to load listings right now.</p>";
    });

  [categorySelect, locationSelect, searchInput].forEach((input) => {
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
  ADMIN_EMAIL,
  APP_URL,
  slugToLabel,
  loadListings,
  renderListings,
  applyFilters,
  parseQueryParams,
  updateURLFromState,
  renderNewestListings,
  initDirectoryPage
};
