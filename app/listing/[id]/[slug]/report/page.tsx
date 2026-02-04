import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { noStore } from "next/cache";
import { getListingById } from "@/lib/listings";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Please complete the report form.",
  rate_limit: "Too many reports from this connection. Try again tomorrow.",
  not_found: "Listing not found."
};

export default async function ReportPage({
  params,
  searchParams
}: {
  params: { id: string; slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  noStore();
  const listing = await getListingById(params.id);
  if (!listing) {
    notFound();
  }

  if (listing.slug !== params.slug) {
    redirect(`/listing/${listing.id}/${listing.slug}/report`);
  }

  const sent = searchParams.sent === "1";
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const errorMessage = errorMessages[errorKey];

  return (
    <div>
      <section>
        <h1>Report abuse</h1>
        <p>
          <Link href={`/listing/${listing.id}/${listing.slug}`}>Back to listing</Link>
        </p>
      </section>

      {sent ? (
        <div className="banner">Report submitted. Thank you.</div>
      ) : null}
      {errorMessage ? <div className="banner">{errorMessage}</div> : null}

      <form method="post">
        <div className="form-row">
          <label htmlFor="reason">Reason</label>
          <select id="reason" name="reason" required>
            <option value="">Select a reason</option>
            <option value="spam">Spam</option>
            <option value="scam">Scam</option>
            <option value="harassment">Harassment</option>
            <option value="personal-info">Personal info / doxxing</option>
            <option value="prohibited">Prohibited content</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="details">Details</label>
          <textarea id="details" name="details" required maxLength={2000} />
        </div>
        <div className="form-row">
          <label htmlFor="reporter_email">Your email (optional)</label>
          <input id="reporter_email" name="reporter_email" type="email" />
        </div>
        <div className="honeypot">
          <label htmlFor="website">Leave this field blank</label>
          <input id="website" name="website" type="text" />
        </div>
        <button type="submit">Submit report</button>
      </form>
    </div>
  );
}
