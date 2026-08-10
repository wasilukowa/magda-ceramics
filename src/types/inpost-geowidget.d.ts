import type { DetailedHTMLProps, HTMLAttributes } from "react";

// The InPost Geowidget ships as a custom element (<inpost-geowidget>) loaded
// from their CDN. React 19 keeps the JSX namespace under "react", so we augment
// IntrinsicElements there to type the few attributes we set on it.
type InPostGeowidgetAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  token?: string;
  language?: string;
  config?: string;
  onpoint?: string;
  // International widget only: comma-separated ISO codes; the first one sets
  // the map's default position.
  country?: string;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "inpost-geowidget": InPostGeowidgetAttributes;
    }
  }
}
