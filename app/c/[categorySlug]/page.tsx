import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { getCategoryBySlug } from "@/lib/config";
import { searchListings } from "@/lib/listings";
import { ListingList } from "@/app/_components/ListingList";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { categorySlug: string } }) {
  const category = getCategoryBySlug(params.categorySlug);
  return {
    title: category ? `${category} - Mike's List` : "Category - Mike's List"
  };
}

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: { categorySlug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  unstable_noStore();
  const category = getCategoryBySlug(params.categorySlug);
  const page = Number(searchParams.page || "1") || 1;

  if (!category) {
    return (
      <div>
        <h1>Category not found</h1>
        <p>
          <Link href="/browse">Browse all listings</Link>
        </p>
      </div>
    );
  }

  const result = await searchListings({
    categorySlug: params.categorySlug,
    page,
    pageSize: 20
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div>
      <section>
        <h1>{category}</h1>
        <p>
          <Link href={`/browse?category=${params.categorySlug}`}>Full filters</Link>
        </p>
      </section>
      <section>
        <ListingList listings={result.listings} />
        <div className="pagination">
          {page > 1 ? (
            <Link href={`/c/${params.categorySlug}?page=${page - 1}`}>Previous</Link>
          ) : null}
          {page < totalPages ? (
            <Link href={`/c/${params.categorySlug}?page=${page + 1}`}>Next</Link>
          ) : null}
          <span className="small">
            Page {page} of {totalPages}
          </span>
        </div>
      </section>
    </div>
  );
}
