const ADMIN_EMAIL = "admin@mikeslist.com";

function getSiteRoot() {
  if (window.location.protocol === "file:") {
    return "";
  }
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  return `/${parts[0]}`;
}

function withRoot(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const root = getSiteRoot();
  return `${root}${cleanPath}`;
}

function buildListingUrl(id) {
  return `${withRoot("/listing/index.html")}?id=${encodeURIComponent(id)}`;
}

async function loadListings() {
  const response = await fetch(withRoot("/assets/listings.json"));
  if (!response.ok) {
    throw new Error("Unable to load listings.");
  }
  return response.json();
}

function parseQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const tags = params.getAll("tags");
  let tagList = tags;
  if (tagList.length === 1 && tagList[0].includes(",")) {
    tagList = tagList[0].split(",").map((tag) => tag.trim()).filter(Boolean);
  }
  return {
    q: params.get("q") || "",
    category: params.get("category") || "",
    location: params.get("location") || "",
    tags: tagList
  };
}

function applyFilters(listings, filters) {
  const search = filters.q.trim().toLowerCase();
  const tags = filters.tags || [];
  return listings.filter((listing) => {
    if (filters.category && listing.categorySlug !== filters.category) {
      return false;
    }
    if (filters.location && listing.locationSlug !== filters.location) {
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

function renderListingRows(container, listings, countEl) {
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
    link.href = buildListingUrl(listing.id);
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

function initDirectoryPage(config) {
  const categorySelect = config.categorySelectId
    ? document.getElementById(config.categorySelectId)
    : null;
  const locationSelect = config.locationSelectId
    ? document.getElementById(config.locationSelectId)
    : null;
  const searchInput = config.searchInputId
    ? document.getElementById(config.searchInputId)
    : null;
  const tagInputs = config.tagSelector
    ? Array.from(document.querySelectorAll(config.tagSelector))
    : [];
  const resultsContainer = document.getElementById(config.resultsContainerId);
  const countEl = config.countId ? document.getElementById(config.countId) : null;

  if (!resultsContainer) return;

  const params = parseQueryParams();
  const state = {
    category: params.category || config.categorySlug || "",
    location: params.location || config.locationSlug || "",
    q: params.q || "",
    tags: params.tags || []
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
  if (tagInputs.length > 0 && state.tags.length > 0) {
    tagInputs.forEach((input) => {
      if (state.tags.includes(input.value)) {
        input.checked = true;
      }
    });
  }

  let listingsCache = [];

  function readFilters() {
    const selectedTags = tagInputs
      .filter((input) => input.checked)
      .map((input) => input.value);

    return {
      category: categorySelect ? categorySelect.value : config.categorySlug || "",
      location: locationSelect ? locationSelect.value : config.locationSlug || "",
      q: searchInput ? searchInput.value : "",
      tags: selectedTags
    };
  }

  function syncUrl(filters) {
    if (!config.syncUrl) return;
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.location) params.set("location", filters.location);
    if (filters.q) params.set("q", filters.q);
    filters.tags.forEach((tag) => params.append("tags", tag));
    const next = params.toString();
    const base = window.location.pathname;
    window.history.replaceState({}, "", next ? `${base}?${next}` : base);
  }

  function update() {
    const filters = readFilters();
    const filtered = applyFilters(listingsCache, filters);
    renderListingRows(resultsContainer, filtered, countEl);
    syncUrl(filters);
  }

  loadListings()
    .then((listings) => {
      listingsCache = listings;
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

  tagInputs.forEach((input) => {
    input.addEventListener("change", update);
  });
}

window.MikesList = {
  ADMIN_EMAIL,
  loadListings,
  renderListingRows,
  applyFilters,
  parseQueryParams,
  initDirectoryPage
};
