"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "@/hooks/useWishlist";
import { getWishlistProducts } from "@/server-actions/wishlist";
import { ProductProps } from "@/contracts/server/product";
import ProductCard, { EAGER_CARDS } from "@/components/ProductCard";

export default function WishlistGrid() {
  const t = useTranslations("wishlist");
  const { ids, dropMissing } = useWishlist();
  // Trzy stany, nie dwa: „jeszcze nie pytaliśmy", „mamy odpowiedź" i „zapytanie
  // padło". Wcześniej awaria WooCommerce była nie do odróżnienia od pustej
  // listy i strona mówiła klientowi, że nie ma ulubionych — a miał.
  const [products, setProducts] = useState<ProductProps[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ids.length === 0) return;

    let active = true;
    getWishlistProducts(ids).then((items) => {
      if (!active) return;
      setFailed(items === null);
      if (items === null) return;
      setProducts(items);

      // Praca usunięta ze sklepu wisiałaby na liście na zawsze: licznik ją
      // liczy, a kliknąć nie ma czego, bo kafelka nie ma. Sprzątamy — ale
      // TYLKO gdy odpowiedź nie jest pusta. Pusta znaczy równie dobrze
      // „WooCommerce nie odpowiedział", a wtedy skasowalibyśmy komuś całą
      // listę przez czkawkę serwera.
      if (items.length > 0) dropMissing(items.map((item) => item.id));
    });
    return () => {
      active = false;
    };
  }, [ids, dropMissing]);

  const loaded = ids.length === 0 || products !== null || failed;

  if (!loaded) {
    return (
      <p className="text-sm text-[var(--muted)] text-center py-10">
        {t("loading")}
      </p>
    );
  }

  if (failed) {
    return (
      <p className="border border-[var(--border)] px-6 py-10 text-sm text-center text-[var(--color-error)]">
        {t("loadFailed")}
      </p>
    );
  }

  // Zachowaj tylko produkty wciąż obecne na liście (po usunięciu).
  const visible = (products ?? []).filter((p) => ids.includes(p.id));

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-6">
        <p className="text-sm text-[var(--muted)]">{t("empty")}</p>
        <Link
          href="/shop"
          className="text-xs tracking-widest uppercase border border-[var(--foreground)] px-8 py-3 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          {t("browse")}
        </Link>
      </div>
    );
  }

  // Sprzedane prace zostają w ulubionych — nikt ich stąd nie wyrzuca — ale
  // stoją osobno, pod własnym nagłówkiem. Sama plakietka na zdjęciu to za
  // mało: w gęstej siatce wzrok jej nie łapie, a klient ma od razu wiedzieć,
  // co jeszcze może kupić, a co ogląda już tylko dla przyjemności.
  const dostepne = visible.filter((product) => product.inStock);
  const sprzedane = visible.filter((product) => !product.inStock);

  const siatka = (produkty: ProductProps[], odIndeksu: number) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
      {/* Serce siedzi w samej karcie (ProductCard), więc ta strona nie dokłada
          już własnego — jedno miejsce, jeden wygląd. */}
      {produkty.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          soldOutLabel={t("sold")}
          eager={odIndeksu + index < EAGER_CARDS}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-16">
      {dostepne.length > 0 && siatka(dostepne, 0)}

      {sprzedane.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs uppercase tracking-widest">
            {t("archivedTitle")}
          </h2>
          <p className="mb-8 text-sm text-[var(--muted)]">
            {t("archivedIntro")}
          </p>
          {siatka(sprzedane, dostepne.length)}
        </section>
      )}
    </div>
  );
}
