export type AddressParts = {
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

export function formatFullAddress(a: AddressParts) {
  const line1 = [a.address].filter(Boolean).join("");
  const line2 = [a.city, a.postal_code].filter(Boolean).join(" ");
  const line3 = [a.country].filter(Boolean).join("");

  const parts = [line1, line2, line3].filter((x) => x && x.trim().length > 0);
  return parts.length ? parts.join(", ") : "—";
}
