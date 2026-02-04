import { maxLinksInDescription, spamKeywords } from "./config";
import { countLinks } from "./link-counter";

export function evaluateListingForSpam(input: { title: string; description: string }) {
  const combined = `${input.title} ${input.description}`.toLowerCase();
  const matchedKeywords = spamKeywords.filter((keyword) => combined.includes(keyword.toLowerCase()));
  const linkCount = countLinks(input.description);
  const tooManyLinks = linkCount > maxLinksInDescription || linkCount >= 3;
  const suspicious = matchedKeywords.length > 0 || linkCount > 0;

  return {
    matchedKeywords,
    linkCount,
    tooManyLinks,
    suspicious
  };
}
