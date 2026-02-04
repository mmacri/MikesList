const urlPattern = /(https?:\/\/|www\.)\S+/gi;

export function countLinks(text: string) {
  if (!text) {
    return 0;
  }
  const matches = text.match(urlPattern);
  return matches ? matches.length : 0;
}
