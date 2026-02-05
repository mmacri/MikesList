import { unstable_noStore } from "next/cache";
import { categories, slugify, tags as tagOptions } from "@/lib/config";
import { parseLocationSlug } from "@/lib/location";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Please check the form and try again.",
  rate_limit: "Posting limit reached for today.",
  spam: "Your post was blocked due to spam filters.",
  links: "Too many links in the description.",
  server: "Something went wrong. Please try again."
};

export default async function PostPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  unstable_noStore();
  const success = searchParams.success === "1";
  const pending = searchParams.pending === "1";
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const errorMessage = errorMessages[errorKey];
  const locationSlugParam =
    typeof searchParams.locationSlug === "string"
      ? searchParams.locationSlug
      : typeof searchParams.location === "string"
        ? searchParams.location
        : "";

  let locationTypeDefault = "city";
  let cityDefault = "";
  let stateDefault = "";

  if (locationSlugParam) {
    if (locationSlugParam === "remote") {
      locationTypeDefault = "remote";
    } else {
      const parsed = parseLocationSlug(locationSlugParam);
      if (parsed) {
        locationTypeDefault = "city";
        cityDefault = parsed.city;
        stateDefault = parsed.state;
      }
    }
  }

  return (
    <div>
      <section>
        <h1>Post a listing</h1>
        <p className="small">Short, clear listings work best.</p>
      </section>

      {success ? (
        <div className="banner">Check your email to manage your listing.</div>
      ) : null}
      {pending ? (
        <div className="banner">
          Your listing is pending review. Check your email for the manage link.
        </div>
      ) : null}
      {errorMessage ? <div className="banner">{errorMessage}</div> : null}

      <form method="post">
        <div className="form-row">
          <label htmlFor="poster_email">Your email (private)</label>
          <input id="poster_email" name="poster_email" type="email" required />
        </div>
        <div className="form-row">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" type="text" maxLength={90} required />
        </div>
        <div className="form-row">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" required>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={slugify(category)}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="location_type">Location type</label>
          <select id="location_type" name="location_type" required defaultValue={locationTypeDefault}>
            <option value="city">City</option>
            <option value="remote">Remote/Online</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="city">City (required for city listings)</label>
          <input id="city" name="city" type="text" defaultValue={cityDefault} />
        </div>
        <div className="form-row">
          <label htmlFor="state">State (required for city listings)</label>
          <input id="state" name="state" type="text" defaultValue={stateDefault} />
        </div>
        <div className="form-row">
          <label>Tags</label>
          <div className="tag-list">
            {tagOptions.map((tag) => (
              <label key={tag} className="tag-item">
                <input type="checkbox" name="tags" value={tag} />
                {tag}
              </label>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="price_amount">Price (optional)</label>
          <input id="price_amount" name="price_amount" type="number" min={0} step={1} />
        </div>
        <div className="form-row">
          <label htmlFor="price_unit">Price unit (optional)</label>
          <input id="price_unit" name="price_unit" type="text" placeholder="/hr, /project" />
        </div>
        <div className="form-row">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" maxLength={4000} required />
        </div>
        <div className="honeypot">
          <label htmlFor="website">Leave this field blank</label>
          <input id="website" name="website" type="text" />
        </div>
        <button type="submit">Post listing</button>
      </form>
    </div>
  );
}
