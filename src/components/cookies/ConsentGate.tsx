"use client";

import { CookieCategory } from "@/contracts/shared";
import { useConsent } from "@/lib/store/providers/ConsentProvider";

// Renders its children only once the customer has granted that category, and
// unmounts them the moment consent is withdrawn. This is where an analytics
// or marketing script belongs — never outside it:
//
//   <ConsentGate category={CookieCategory.Analytics}>
//     <GoogleAnalytics gaId="G-XXXX" />
//   </ConsentGate>
export function ConsentGate({
  category,
  children,
}: {
  category: CookieCategory;
  children: React.ReactNode;
}) {
  const { isGranted } = useConsent();
  return isGranted(category) ? <>{children}</> : null;
}
