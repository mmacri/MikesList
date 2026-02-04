export function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

export function getOptionalFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

export function getNumberFromForm(formData: FormData, key: string) {
  const raw = getOptionalFormValue(formData, key);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.round(parsed);
}

export function getTagsFromForm(formData: FormData) {
  const values = formData.getAll("tags");
  return values.filter((value) => typeof value === "string") as string[];
}
