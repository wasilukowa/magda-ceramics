import { NavLink, ShopCategory, Country } from "./types";

export const NAV_LINKS: NavLink[] = [
  { label: "Home", url: "/" },
  { label: "Shop", url: "/sklep" },
  { label: "Contact", url: "/kontakt" },
];

export const SHOP_CATEGORIES: ShopCategory[] = [
  { name: "Mugs", slug: "kubki" },
  { name: "Bowls", slug: "miski" },
  { name: "Smalls", slug: "maluszki" },
  { name: "Vases", slug: "wazony" },
  { name: "Miscellaneous", slug: "roznosci" },
];

export const HOMEPAGE_CATEGORIES: ShopCategory[] = [
  { name: "Mugs", slug: "kubki", emoji: "☕" },
  { name: "Bowls", slug: "miski", emoji: "🥣" },
  { name: "Smalls", slug: "maluszki", emoji: "🌿" },
  { name: "Vases", slug: "wazony", emoji: "🏺" },
  { name: "Miscellaneous", slug: "roznosci", emoji: "✨" },
];

export const INSTAGRAM_URL = "https://www.instagram.com/magda_ceramics";
export const INSTAGRAM_HANDLE = "@magda_ceramics";

export const CHECKOUT_COUNTRIES: Country[] = [
  { code: "PL", label: "Poland" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "IT", label: "Italy" },
  { code: "ES", label: "Spain" },
  { code: "CZ", label: "Czech Republic" },
  { code: "US", label: "USA" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
];
