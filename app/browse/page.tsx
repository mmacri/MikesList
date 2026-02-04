import Link from "next/link";
import { noStore } from "next/cache";
import { categories, slugify, tags as tagOptions } from "@/lib/config";
import { buildLocation, locationLabelFromSlug } from "@/lib/location";
import { searchListings } from "@/lib/listings";
import { ListingList } from "@/app/_components/ListingList";

export const dynamic = "force-dynamic";

function toArray(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function BrowsePage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  noStore();
  const page = Number(searchParams.page || "1") || 1;
  const categorySlug = typeof searchParams.category === "string" ? searchParams.category : undefined;
  const locationType = typeof searchParams.location_type === "string" ? searchParams.location_type : "any";
  const city = typeof searchParams.city === "string" ? searchParams.city : "";
  const state = typeof searchParams.state === "string" ? searchParams.state : "";
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "newest";
  const selectedTags = toArray(searchParams.tags);

  let locationSlug: string | undefined = undefined;
  let activeLocationType: "city" | "remote" | undefined = undefined;

  if (locationType === "remote") {
    activeLocationType = "remote";
    locationSlug = "remote";
  } else if (locationType === "city" && city && state) {
    const location = buildLocation({
      locationType: "city",
      city,
      state
    });
    activeLocationType = "city";
    locationSlug = location.locationSlug;
  }

  const result = await searchListings({
    categorySlug,
    locationType: activeLocationType,
    locationSlug,
    tags: selectedTags,
    q,
    sort,
    page,
    pageSize: 20
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const queryBase = new URLSearchParams();
  if (categorySlug) queryBase.set("category", categorySlug);
  if (locationType) queryBase.set("location_type", locationType);
  if (city) queryBase.set("city", city);
  if (state) queryBase.set("state", state);
  if (q) queryBase.set("q", q);
  if (sort) queryBase.set("sort", sort);
  selectedTags.forEach((tag) => queryBase.append("tags", tag));

  const prevParams = new URLSearchParams(queryBase);
  prevParams.set("page", String(page - 1));
  const nextParams = new URLSearchParams(queryBase);
  nextParams.set("page", String(page + 1));

  return (
    <div>
      <section>
        <h1>Browse listings</h1>
        <form method="get" action="/browse">
          <div className="form-row">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={categorySlug || ""}>
              <option value="">Any category</option>
              {categories.map((category) => {
                const slug = slugify(category);
                return (
                  <option key={slug} value={slug}>
                    {category}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="location_type">Location type</label>
            <select id="location_type" name="location_type" defaultValue={locationType}>
              <option value="any">Any</option>
              <option value="city">City</option>
              <option value="remote">Remote/Online</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" defaultValue={city} />
          </div>

          <div className="form-row">
            <label htmlFor="state">State</label>
            <input id="state" name="state" type="text" defaultValue={state} />
          </div>

          <div className="form-row">
            <label htmlFor="q">Search</label>
            <input id="q" name="q" type="text" defaultValue={q} />
          </div>

          <div className="form-row">
            <label htmlFor="sort">Sort</label>
            <select id="sort" name="sort" defaultValue={sort}>
              <option value="newest">Newest</option>
              <option value="expiring">Expiring soon</option>
              <option value="featured">Featured first</option>
            </select>
          </div>

          <div className="form-row">
            <label>Tags</label>
            <div className="tag-list">
              {tagOptions.map((tag) => (
                <label key={tag} className="tag-item">
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    defaultChecked={selectedTags.includes(tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>

          <button type="submit">Apply filters</button>
        </form>
      </section>

      <section>
        <h2>Results</h2>
        {activeLocationType && locationSlug ? (
          <p className="small">
            Location: {locationLabelFromSlug(locationSlug)}
          </p>
        ) : null}
        <ListingList listings={result.listings} />
        <div className="pagination">
          {page > 1 ? (
            <Link href={`/browse?${prevParams.toString()}`}>Previous</Link>
          ) : null}
          {page < totalPages ? (
            <Link href={`/browse?${nextParams.toString()}`}>Next</Link>
          ) : null}
          <span className="small">
            Page {page} of {totalPages}
          </span>
        </div>
      </section>
    </div>
  );
}
