"use client";

import { useMemo } from "react";
import type { Appearance } from "@stripe/stripe-js";
import { useTheme } from "@/hooks/useTheme";
import { getStripeAppearance } from "@/lib/helpers/stripeAppearance";

// Wygląd formularza Stripe'a, odczytany z kolorów strony na nowo po każdej
// zmianie trybu jasny/ciemny — także gdy klient przełączy go w trakcie
// płacenia. Elements przekazuje nowy wygląd do ramki Stripe'a sam
// (elements.update), bez gubienia wpisanych danych karty.
export const useStripeAppearance = (): Appearance => {
  const { theme } = useTheme();
  // `theme` nie występuje w środku, ale to on zmienia kolory, które
  // getStripeAppearance czyta z CSS — dlatego stoi w zależnościach, choć
  // reguła lintera widzi w nim zbędny wpis.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => getStripeAppearance(), [theme]);
};
