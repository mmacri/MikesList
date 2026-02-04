import Link from "next/link";
import { noStore } from "next/cache";
import { locationLabelFromSlug, parseLocationSlug } from "@/lib/location";
import { searchListings } from "@/lib/listings";
import { ListingList } from "@/app/_components/ListingList";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { locationSlug: string } }) {
  const label = locationLabelFromSlug(params.locationSlug);
  return {
    title: `${label} - Mike's List`
  };
}

export default async function LocationPage({
  params,
  searchParams
}: {
  params: { locationSlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  noStore();
  const page = Number(searchParams.page || "1") || 1;
  const locationType = params.locationSlug === "remote" ? "remote" : "city";

  const result = await searchListings({
    locationType,
    locationSlug: params.locationSlug,
    page,
    pageSize: 20
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const label = locationLabelFromSlug(params.locationSlug);
  const parsed = parseLocationSlug(params.locationSlug);
  const filtersLink =
    locationType === "remote"
      ? "/browse?location_type=remote"
      : parsed
        ? `/browse?location_type=city&city=${encodeURIComponent(parsed.city)}&state=${encodeURIComponent(parsed.state)}`
        : "/browse?location_type=city";

  return (
    <div>
      <section>
        <h1>{label}</h1>
        <p>
          <Link href={filtersLink}>Full filters</Link>
        </p>
      </section>
      <section>
        <ListingList listings={result.listings} />
        <div className="pagination">
          {page > 1 ? (
            <Link href={`/l/${params.locationSlug}?page=${page - 1}`}>Previous</Link>
          ) : null}
          {page < totalPages ? (
            <Link href={`/l/${params.locationSlug}?page=${page + 1}`}>Next</Link>
          ) : null}
          <span className="small">
            Page {page} of {totalPages}
          </span>
        </div>
      </section>
    </div>
  );
}
