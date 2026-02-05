import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { getListingById } from "@/lib/listings";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  invalid: "Please check your email and message.",
  rate_limit: "Too many replies from this connection. Try again tomorrow.",
  closed: "Replies are closed for this listing.",
  not_found: "Listing not found."
};

export default async function ReplyPage({
  params,
  searchParams
}: {
  params: { id: string; slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  unstable_noStore();
  const listing = await getListingById(params.id);
  if (!listing) {
    notFound();
  }

  if (listing.slug !== params.slug) {
    redirect(`/listing/${listing.id}/${listing.slug}/reply`);
  }

  const now = new Date();
  const expired = listing.expiresAt < now || listing.status !== "active";
  const unapproved = listing.moderationStatus !== "approved";
  const sent = searchParams.sent === "1";
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const errorMessage = errorMessages[errorKey];

  return (
    <div>
      <section>
        <h1>Reply to: {listing.title}</h1>
        <p>
          <Link href={`/listing/${listing.id}/${listing.slug}`}>Back to listing</Link>
        </p>
      </section>

      {sent ? (
        <div className="banner">Reply sent. The poster will receive your message.</div>
      ) : null}
      {errorMessage ? <div className="banner">{errorMessage}</div> : null}

      {expired || unapproved ? (
        <div className="banner">Replies are closed for this listing.</div>
      ) : (
        <form method="post">
          <div className="form-row">
            <label htmlFor="your_email">Your email</label>
            <input id="your_email" name="your_email" type="email" required />
          </div>
          <div className="form-row">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" required maxLength={2000} />
          </div>
          <div className="honeypot">
            <label htmlFor="website">Leave this field blank</label>
            <input id="website" name="website" type="text" />
          </div>
          <button type="submit">Send reply</button>
        </form>
      )}
    </div>
  );
}
