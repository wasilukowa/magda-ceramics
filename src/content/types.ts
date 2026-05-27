export type NavLink = {
  label: string;
  url: string;
  children?: NavLink[];
};

export type ShopCategory = {
  name: string;
  slug: string;
  emoji?: string;
};

export type Country = {
  code: string;
  label: string;
};
