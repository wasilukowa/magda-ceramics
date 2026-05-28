import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("footer");
  return { title: `${t("privacyTitle")} — Magda Ceramics` };
}

function PrivacyEN() {
  return (
    <div className="space-y-8 text-sm text-[var(--muted)] leading-relaxed">
      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 1. General Provisions</h2>
        <div className="space-y-3">
          <p>The administrator of personal data collected through the Online Store is Magdalena Łęgowiak, Ul. Pełczyńskiego 14A/198, 01-471 Warsaw, Poland. Email: <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a> (hereinafter: &quot;Administrator&quot;).</p>
          <p>The Customer&apos;s personal data are processed in accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council of 24 April 2016 (GDPR) and applicable data protection laws.</p>
          <p>The Administrator ensures that the collected data are processed lawfully and with special care for the interests of data subjects.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 2. Purpose and Legal Basis of Data Processing</h2>
        <div className="space-y-3">
          <p>Customers&apos; personal data are processed for the following purposes:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong className="text-[var(--foreground)]">Performance of the sales contract</strong> (Art. 6(1)(b) GDPR) — name, surname, delivery address, email address, phone number, Tax ID (for businesses).</li>
            <li><strong className="text-[var(--foreground)]">Accounting and tax settlements</strong> (Art. 6(1)(c) GDPR) — compliance with legal obligations.</li>
            <li><strong className="text-[var(--foreground)]">Legal claims</strong> (Art. 6(1)(f) GDPR) — the legitimate interest of the Administrator.</li>
            <li><strong className="text-[var(--foreground)]">Direct marketing / Newsletter</strong> (Art. 6(1)(a) GDPR) — only with the Customer&apos;s voluntary consent.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 3. Data Recipients</h2>
        <div className="space-y-3">
          <p>To fulfill the order, the Administrator may share the Customer&apos;s data with:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Electronic payment operator (Stripe) — to process payments.</li>
            <li>Courier and logistics companies (InPost / DPD / DHL) — to deliver the package.</li>
            <li>Accounting office — for store bookkeeping services.</li>
            <li>Hosting and e-commerce platform providers supporting the store.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 4. Data Retention Period</h2>
        <p>Personal data will be stored for the period necessary to execute the sales contract, and thereafter for a period corresponding to the statute of limitations for claims (usually 6 years for tax and accounting purposes) or until consent is withdrawn in the case of the Newsletter.</p>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 5. Customer Rights</h2>
        <div className="space-y-3">
          <p>Every Customer has the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Access their data and receive a copy.</li>
            <li>Rectify (correct) their data.</li>
            <li>Erase data (&quot;the right to be forgotten&quot;) — if there are no other legal grounds for processing.</li>
            <li>Restrict processing or object to processing.</li>
            <li>Withdraw consent at any time.</li>
            <li>Lodge a complaint with the President of the Personal Data Protection Office (UODO) or the local supervisory authority.</li>
          </ul>
          <p>To exercise the above rights, please contact: <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a></p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 6. Cookie Policy</h2>
        <div className="space-y-3">
          <p>The online store uses cookies — small text files saved on the Customer&apos;s device.</p>
          <p>Cookies are used to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Maintain the Customer&apos;s session (e.g., remembering items added to the cart).</li>
            <li>Adapt website content to user preferences.</li>
            <li>Create anonymous website traffic statistics (e.g., Google Analytics).</li>
          </ul>
          <p>The Customer can change cookie settings in their web browser at any time, including blocking them completely.</p>
        </div>
      </section>
    </div>
  );
}

function PrivacyPL() {
  return (
    <div className="space-y-8 text-sm text-[var(--muted)] leading-relaxed">
      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 1. Postanowienia ogólne</h2>
        <div className="space-y-3">
          <p>Administratorem danych osobowych zbieranych za pośrednictwem Sklepu Internetowego jest Magdalena Łęgowiak, Ul. Pełczyńskiego 14A/198, 01-471 Warszawa. Email: <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a> (dalej jako: „Administrator").</p>
          <p>Dane osobowe Klienta są przetwarzane zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) oraz ustawą o ochronie danych osobowych.</p>
          <p>Administrator dokłada szczególnej staranności w celu ochrony interesów osób, których dane dotyczą, zapewniając że dane przetwarzane są zgodnie z prawem.</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 2. Cel i podstawa przetwarzania danych</h2>
        <div className="space-y-3">
          <p>Dane osobowe Klientów przetwarzane są w następujących celach:</p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li><strong className="text-[var(--foreground)]">Realizacja zamówienia i umowy sprzedaży</strong> (art. 6 ust. 1 lit. b RODO) — imię, nazwisko, adres dostawy, e-mail, numer telefonu, NIP (w przypadku firm).</li>
            <li><strong className="text-[var(--foreground)]">Rozliczenia księgowe i podatkowe</strong> (art. 6 ust. 1 lit. c RODO) — realizacja obowiązków prawnych.</li>
            <li><strong className="text-[var(--foreground)]">Ustalenie lub obrona roszczeń</strong> (art. 6 ust. 1 lit. f RODO) — prawnie uzasadniony interes Administratora.</li>
            <li><strong className="text-[var(--foreground)]">Marketing bezpośredni / Newsletter</strong> (art. 6 ust. 1 lit. a RODO) — wyłącznie za zgodą Klienta.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 3. Odbiorcy danych</h2>
        <div className="space-y-3">
          <p>W celu realizacji zamówienia Administrator może udostępniać dane Klienta:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Operatorowi płatności Stripe — w celu obsługi płatności.</li>
            <li>Firmom kurierskim (InPost / DPD / DHL) — w celu dostarczenia przesyłki.</li>
            <li>Biuru rachunkowemu — w celu obsługi księgowej sklepu.</li>
            <li>Dostawcy hostingu i systemu e-commerce.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 4. Okres przechowywania danych</h2>
        <p>Dane osobowe będą przechowywane przez okres niezbędny do realizacji umowy sprzedaży, a po tym czasie przez okres odpowiadający przedawnieniu roszczeń (zazwyczaj 6 lat dla celów podatkowych i księgowych) lub do momentu wycofania zgody w przypadku Newslettera.</p>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 5. Prawa klienta</h2>
        <div className="space-y-3">
          <p>Każdemu Klientowi przysługuje prawo do:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Wglądu w swoje dane oraz otrzymania ich kopii.</li>
            <li>Sprostowania (poprawiania) swoich danych.</li>
            <li>Usunięcia danych („prawo do bycia zapomnianym") — jeśli nie ma innych podstaw prawnych do ich przetwarzania.</li>
            <li>Ograniczenia przetwarzania lub wniesienia sprzeciwu.</li>
            <li>Cofnięcia zgody w dowolnym momencie.</li>
            <li>Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO).</li>
          </ul>
          <p>W celu skorzystania z powyższych praw prosimy o kontakt: <a href="mailto:info@magdaceramics.com" className="text-[var(--foreground)] underline">info@magdaceramics.com</a></p>
        </div>
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">§ 6. Pliki cookies (ciasteczka)</h2>
        <div className="space-y-3">
          <p>Sklep internetowy używa plików cookies — małych plików tekstowych zapisywanych na urządzeniu końcowym Klienta.</p>
          <p>Pliki cookies wykorzystywane są w celu:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Utrzymania sesji Klienta (np. zapamiętanie produktów dodanych do koszyka).</li>
            <li>Dostosowania zawartości strony do preferencji użytkownika.</li>
            <li>Tworzenia anonimowych statystyk ruchu (np. Google Analytics).</li>
          </ul>
          <p>Klient może w każdej chwili zmienić ustawienia dotyczące plików cookies w swojej przeglądarce, w tym całkowicie je zablokować.</p>
        </div>
      </section>
    </div>
  );
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("footer");

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("privacyTitle")}
      </h1>
      {locale === "pl" ? <PrivacyPL /> : <PrivacyEN />}
    </div>
  );
}
