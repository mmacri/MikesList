export function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function formatPrice(amount: number | null, unit?: string | null) {
  if (amount === null || Number.isNaN(amount)) {
    return "";
  }
  const base = `$${amount}`;
  if (unit) {
    return `${base} ${unit}`;
  }
  return base;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) {
    return "email on file";
  }
  const maskedLocal = local.length <= 2 ? "*" : `${local.charAt(0)}***`;
  return `${maskedLocal}@${domain}`;
}
