import { unstable_noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getListingByToken, parseTags } from "@/lib/listings";
import { categories, slugify, tags as tagOptions } from "@/lib/config";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Please check the form and try again.",
  not_found: "Listing not found."
};

export default async function ManageEditPage({
  params,
  searchParams
}: {
  params: { token: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  unstable_noStore();
  const listing = await getListingByToken(params.token);
  if (!listing) {
    notFound();
  }

  const tags = parseTags(listing.tags);
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const errorMessage = errorMessages[errorKey];

  return (
    <div>
      <h1>Edit listing</h1>
      {errorMessage ? <div className="banner">{errorMessage}</div> : null}
      <form method="post">
        <div className="form-row">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" maxLength={90} defaultValue={listing.title} required />
        </div>
        <div className="form-row">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" defaultValue={listing.categorySlug} required>
            {categories.map((category) => (
              <option key={category} value={slugify(category)}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="location_type">Location type</label>
          <select id="location_type" name="location_type" defaultValue={listing.locationType}>
            <option value="city">City</option>
            <option value="remote">Remote/Online</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" defaultValue={listing.city || ""} />
        </div>
        <div className="form-row">
          <label htmlFor="state">State</label>
          <input id="state" name="state" type="text" defaultValue={listing.state || ""} />
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
                  defaultChecked={tags.includes(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="price_amount">Price</label>
          <input
            id="price_amount"
            name="price_amount"
            type="number"
            min={0}
            step={1}
            defaultValue={listing.priceAmount ?? ""}
          />
        </div>
        <div className="form-row">
          <label htmlFor="price_unit">Price unit</label>
          <input id="price_unit" name="price_unit" type="text" defaultValue={listing.priceUnit ?? ""} />
        </div>
        <div className="form-row">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            maxLength={4000}
            defaultValue={listing.description}
            required
          />
        </div>
        <div className="honeypot">
          <label htmlFor="website">Leave this field blank</label>
          <input id="website" name="website" type="text" />
        </div>
        <button type="submit">Save changes</button>
      </form>
    </div>
  );
}
