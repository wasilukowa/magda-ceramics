import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("footer");
  return { title: `${t("termsTitle")} — Magda Ceramics` };
}

function TermsEN() {
  return (
    <div className="space-y-8 text-sm text-[var(--muted)] leading-relaxed">
      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 1. General Provisions</h2>
        <div className="space-y-3">
          <p>The online store operating at www.magdaceramics.com is operated by: Magdalena Łęgowiak, Ul. Pełczyńskiego 14A/198, 01-471 Warsaw, Poland, as an unregistered business activity.</p>
          <p>These Terms and Conditions define the rules for using the Store, placing orders, delivering products, the right to withdraw from the contract, and complaint procedures.</p>
          <p>All products offered in the Store are brand new and handmade (handicraft). Due to the nature of handmade production, individual items may slightly differ in dimensions, color shades, or minor details. This constitutes their unique character and is not considered a product defect.</p>
          <p>The Seller can be contacted via email at: <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a></p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 2. Electronically Supplied Services</h2>
        <div className="space-y-3">
          <p>The Seller provides electronic services enabling the Customer to place an order via the Order Form.</p>
          <p>This service is provided free of charge and is a one-time service. It terminates when the order is placed or when the Customer stops placing it.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 3. Placing and Fulfilling Orders</h2>
        <div className="space-y-3">
          <p>Customers can place an order as a guest or by creating an account in the Store.</p>
          <p>To place an order, select the products, add them to the cart, fill out the delivery form, and choose a payment method.</p>
          <p>The condition for fulfilling the order is clicking the &quot;Buy and Pay&quot; button and paying for the order within the specified period.</p>
          <p>All prices in the Store are gross prices (including taxes) in Polish Zlotys (PLN). Prices do not include delivery costs, which are added during the checkout process.</p>
          <p>After placing an order, the Customer receives an automatic email confirming that the order has been accepted for processing. At this moment, the sales contract is concluded.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 4. Payments and Delivery</h2>
        <div className="space-y-3">
          <p>The Seller provides the following payment methods:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Card payments, BLIK, Apple Pay, Google Pay via Stripe.</li>
            <li>Traditional bank transfer to account: <span className="italic">[bank account number — to be provided]</span></li>
          </ul>
          <p>Available delivery methods:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Domestic delivery (Poland): InPost / DPD / DHL.</li>
            <li>International delivery: DHL Express / Polish Post.</li>
          </ul>
          <p>Delivery costs are covered by the Buyer unless promotional terms state otherwise.</p>
          <p>Order fulfillment time (preparing and safely packing the ceramics) takes up to 3–5 business days from the moment the payment is credited, unless the description of a specific product states otherwise. Shipping time by the carrier should be added to this period.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 5. Right of Withdrawal (Returns)</h2>
        <div className="space-y-3">
          <p>A Consumer has the right to withdraw from the sales contract without giving any reason within 14 days from the day of receiving the package.</p>
          <p>To exercise this right, the Customer must inform the Seller by an unequivocal statement (e.g., by sending an email to <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a>).</p>
          <p>The Customer is obliged to send the product back at their own expense to: Ul. Pełczyńskiego 14A/198, 01-471 Warsaw, Poland, within 14 days of notifying the Seller.</p>
          <p><strong className="text-[var(--foreground)]">Note (Ceramics):</strong> Due to the delicate nature of the products, the Customer is required to pack the returned ceramics securely (it is recommended to use the original packaging and fillers). The Customer is liable for any diminished value resulting from handling beyond what is necessary to assess the product.</p>
          <p>The Seller shall refund all payments, including the costs of the cheapest available delivery, within 14 days of receiving the statement or the physical return of the goods.</p>
          <p><strong className="text-[var(--foreground)]">Exception:</strong> The right of withdrawal does not apply to products made to the Customer&apos;s individual specifications (e.g., ceramics with personalized text or designs).</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 6. Complaints and Warranty</h2>
        <div className="space-y-3">
          <p>The Seller is obliged to deliver a product free of defects and is liable for any lack of conformity under applicable consumer protection laws.</p>
          <p>In the event of a product defect (e.g., a crack that occurred before delivery), the Customer has the right to file a complaint.</p>
          <p>Complaints should be reported by email to <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a>, describing the defect and, if possible, attaching photos.</p>
          <p>In the case of visible damage caused by the courier, it is recommended to draw up a damage report in the presence of the courier and immediately contact the Seller.</p>
          <p>The Seller will consider the complaint within 14 days and inform the Customer of the resolution (replacement, repair, price reduction, or refund).</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 7. Personal Data Protection (GDPR)</h2>
        <div className="space-y-3">
          <p>The Seller is the administrator of the Customers&apos; personal data.</p>
          <p>Personal data is processed solely for the purpose of fulfilling orders and (if the Customer consents) for marketing purposes.</p>
          <p>Detailed rules on data protection and cookie policy can be found in the <a href="/privacy" className="text-[var(--foreground)] underline">Privacy Policy</a> available on the Store&apos;s website.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 8. Final Provisions</h2>
        <div className="space-y-3">
          <p>These Terms and Conditions enter into force on May 28, 2026.</p>
          <p>In matters not regulated herein, the relevant provisions of Polish and European consumer law shall apply.</p>
          <p>The Seller reserves the right to amend these Terms and Conditions. Orders placed before the amendment will be governed by the version in force on the day the order was placed.</p>
        </div>
      </section>
    </div>
  );
}

function TermsPL() {
  return (
    <div className="space-y-8 text-sm text-[var(--muted)] leading-relaxed">
      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 1. Postanowienia ogólne</h2>
        <div className="space-y-3">
          <p>Sklep internetowy działający pod adresem www.magdaceramics.com prowadzony jest przez Magdalenę Łęgowiak, Ul. Pełczyńskiego 14A/198, 01-471 Warszawa, w ramach działalności nierejestrowanej.</p>
          <p>Niniejszy Regulamin określa zasady korzystania ze Sklepu, składania zamówień, dostarczania produktów, prawa do odstąpienia od umowy oraz procedury reklamacyjne.</p>
          <p>Wszystkie produkty oferowane w Sklepie są fabrycznie nowe, wykonane ręcznie (rękodzieło). Ze względu na specyfikę produkcji ręcznej, poszczególne egzemplarze mogą nieznacznie różnić się wymiarami, odcieniem barw czy drobnymi detalami — stanowi to o ich unikalnym charakterze i nie jest wadą produktu.</p>
          <p>Kontakt ze Sprzedawcą jest możliwy za pośrednictwem adresu e-mail: <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a></p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 2. Usługi świadczone drogą elektroniczną</h2>
        <div className="space-y-3">
          <p>Sprzedawca świadczy drogą elektroniczną usługi w zakresie umożliwienia Klientowi złożenia zamówienia poprzez Formularz Zamówienia.</p>
          <p>Usługa ta świadczona jest nieodpłatnie i ma charakter jednorazowy. Ulega zakończeniu z chwilą złożenia zamówienia albo zaprzestania jego składania przez Klienta.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 3. Składanie i realizacja zamówień</h2>
        <div className="space-y-3">
          <p>Klient może złożyć zamówienie jako gość lub założyć konto w Sklepie.</p>
          <p>W celu złożenia zamówienia należy wybrać produkty, dodać je do koszyka, wypełnić formularz dostawy oraz wybrać metodę płatności.</p>
          <p>Warunkiem realizacji zamówienia jest kliknięcie przycisku „Kupuję i płacę" oraz opłacenie zamówienia w wyznaczonym terminie.</p>
          <p>Wszystkie ceny podane w Sklepie są cenami brutto (zawierają podatki) podanymi w polskich złotych (PLN). Ceny nie zawierają kosztów dostawy, które są doliczane w procesie składania zamówienia.</p>
          <p>Po złożeniu zamówienia Klient otrzymuje automatyczną wiadomość e-mail potwierdzającą przyjęcie zamówienia do realizacji. W tym momencie dochodzi do zawarcia umowy sprzedaży.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 4. Płatności i dostawa</h2>
        <div className="space-y-3">
          <p>Sprzedawca udostępnia następujące formy płatności:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Płatności kartą, BLIK, Apple Pay, Google Pay za pośrednictwem operatora Stripe.</li>
            <li>Tradycyjny przelew bankowy na konto o numerze: <span className="italic">[numer konta — do uzupełnienia]</span></li>
          </ul>
          <p>Dostępne metody dostawy:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Dostawa krajowa: InPost / DPD / DHL.</li>
            <li>Dostawa zagraniczna: DHL Express / Poczta Polska.</li>
          </ul>
          <p>Koszt dostawy pokrywa Kupujący, chyba że warunki promocji stanowią inaczej.</p>
          <p>Czas realizacji zamówienia (przygotowanie i bezpieczne zapakowanie ceramiki) wynosi do 3–5 dni roboczych od momentu zaksięgowania wpłaty, chyba że opis konkretnego produktu stanowi inaczej. Do tego czasu należy doliczyć czas transportu przez przewoźnika.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 5. Prawo odstąpienia od umowy (zwroty)</h2>
        <div className="space-y-3">
          <p>Konsument ma prawo odstąpić od umowy sprzedaży bez podania przyczyny w terminie 14 dni od dnia otrzymania przesyłki.</p>
          <p>Aby skorzystać z tego prawa, Klient musi poinformować Sprzedawcę o swojej decyzji w drodze jednoznacznego oświadczenia (np. wysyłając e-mail na adres <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a>).</p>
          <p>Klient ma obowiązek odesłać produkt na własny koszt na adres: Ul. Pełczyńskiego 14A/198, 01-471 Warszawa, w terminie 14 dni od dnia zgłoszenia odstąpienia.</p>
          <p><strong className="text-[var(--foreground)]">Uwaga (ceramika):</strong> Ze względu na delikatny charakter produktów, Klient jest zobowiązany do bezpiecznego zapakowania odsyłanej ceramiki (zaleca się użycie oryginalnych wypełniaczy i kartonu). Klient ponosi odpowiedzialność za zmniejszenie wartości produktu wynikające z korzystania z niego w sposób inny niż było to konieczne do stwierdzenia jego charakteru.</p>
          <p>Sprzedawca zwraca Klientowi wszystkie dokonane płatności, w tym koszt najtańszej dostępnej dostawy, w terminie 14 dni od otrzymania oświadczenia lub fizycznego zwrotu towaru.</p>
          <p><strong className="text-[var(--foreground)]">Wyjątek:</strong> Prawo do odstąpienia od umowy nie przysługuje w przypadku produktów wykonanych na specjalne, indywidualne zamówienie Klienta (np. ceramika z personalizowanym napisem/wzorem).</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 6. Reklamacje</h2>
        <div className="space-y-3">
          <p>Sprzedawca ma obowiązek dostarczyć produkt wolny od wad i odpowiada za brak zgodności towaru z umową na zasadach określonych w Kodeksie Cywilnym oraz Ustawie o prawach konsumenta.</p>
          <p>W przypadku stwierdzenia wady produktu (np. pęknięcie powstałe przed dostawą) Klient ma prawo złożyć reklamację.</p>
          <p>Reklamację należy zgłosić drogą mailową na adres <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a>, opisując wadę i w miarę możliwości załączając zdjęcia.</p>
          <p>W przypadku widocznego uszkodzenia paczki przez kuriera zaleca się spisanie protokołu szkody i niezwłoczne skontaktowanie się ze Sprzedawcą.</p>
          <p>Sprzedawca rozpatrzy reklamację w terminie 14 dni i poinformuje Klienta o sposobie jej rozwiązania (wymiana, naprawa, obniżenie ceny lub zwrot pieniędzy).</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 7. Ochrona danych osobowych (RODO)</h2>
        <div className="space-y-3">
          <p>Administratorem danych osobowych Klientów jest Sprzedawca.</p>
          <p>Dane osobowe przetwarzane są wyłącznie w celu realizacji zamówień oraz (jeśli Klient wyrazi zgodę) w celach marketingowych.</p>
          <p>Szczegółowe zasady ochrony danych oraz polityka plików cookies dostępne są w dokumencie <a href="/pl/polityka-prywatnosci" className="text-[var(--foreground)] underline">Polityka prywatności</a>.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 8. Postanowienia końcowe</h2>
        <div className="space-y-3">
          <p>Regulamin wchodzi w życie z dniem 28 maja 2026 r.</p>
          <p>W sprawach nieuregulowanych niniejszym Regulaminem mają zastosowanie powszechnie obowiązujące przepisy prawa polskiego.</p>
          <p>Sprzedawca zastrzega sobie prawo do zmian w Regulaminie. Do zamówień złożonych przed zmianą stosuje się wersję Regulaminu obowiązującą w dniu złożenia zamówienia.</p>
        </div>
      </section>
    </div>
  );
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("footer");

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("termsTitle")}
      </h1>
      {locale === "pl" ? <TermsPL /> : <TermsEN />}
    </div>
  );
}
