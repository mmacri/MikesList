import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { categories, siteName, slugify } from "@/lib/config";
import { getNewestListings } from "@/lib/listings";
import { ListingList } from "@/app/_components/ListingList";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  unstable_noStore();
  const newest = await getNewestListings(20);

  return (
    <div>
      <section>
        <h1>{siteName}</h1>
        <p>
          <Link href="/browse">browse listings</Link> |{" "}
          <Link href="/post">post a listing</Link>
        </p>
      </section>

      <section>
        <h2>Browse by category</h2>
        <ul className="listing-list">
          {categories.map((category) => (
            <li key={category} className="listing-row">
              <Link href={`/c/${slugify(category)}`}>{category}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Browse by location</h2>
        <form action="/browse" method="get">
          <div className="form-row">
            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" />
          </div>
          <div className="form-row">
            <label htmlFor="state">State</label>
            <input id="state" name="state" type="text" />
          </div>
          <input type="hidden" name="location_type" value="city" />
          <button type="submit">Search location</button>
        </form>
        <p>
          <Link href="/l/remote">Remote/Online</Link>
        </p>
      </section>

      <section>
        <h2>Newest listings</h2>
        <ListingList listings={newest} />
      </section>
    </div>
  );
}
