import { LegalDocumentByLocale } from "@/content/types";
import { CONTACT_EMAIL, STUDIO_ADDRESS_EN, STUDIO_ADDRESS_PL, STUDIO_NAME } from "@/content/data";
import { bullets, link, mail, paragraph, section, strong } from "@/lib/helpers/legal";

// Polityka prywatności i cookies. § 6 opisuje to samo, co lista COOKIE_REGISTRY
// w content/data.ts — dokładając nowe narzędzie do sklepu trzeba poprawić oba
// miejsca (i podbić CONSENT_VERSION).
export const PRIVACY: LegalDocumentByLocale = {
  en: [
    section(
      "§ 1. General Provisions",
      paragraph(
        `The administrator of personal data collected through the Online Store is ${STUDIO_NAME}, ${STUDIO_ADDRESS_EN}. Email: `,
        mail(CONTACT_EMAIL),
        " (hereinafter: “Administrator”)."
      ),
      paragraph(
        "The Customer’s personal data are processed in accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council of 24 April 2016 (GDPR) and applicable data protection laws."
      ),
      paragraph(
        "The Administrator ensures that the collected data are processed lawfully and with special care for the interests of data subjects."
      )
    ),
    section(
      "§ 2. Purpose and Legal Basis of Data Processing",
      paragraph("Customers’ personal data are processed for the following purposes:"),
      bullets(
        [
          strong("Performance of the sales contract"),
          " (Art. 6(1)(b) GDPR) — name, surname, delivery address, email address, phone number, Tax ID (for businesses).",
        ],
        [
          strong("Accounting and tax settlements"),
          " (Art. 6(1)(c) GDPR) — compliance with legal obligations.",
        ],
        [
          strong("Legal claims"),
          " (Art. 6(1)(f) GDPR) — the legitimate interest of the Administrator.",
        ],
        [
          strong("Direct marketing / Newsletter"),
          " (Art. 6(1)(a) GDPR) — only with the Customer’s voluntary consent.",
        ]
      )
    ),
    section(
      "§ 3. Data Recipients",
      paragraph("To fulfill the order, the Administrator may share the Customer’s data with:"),
      bullets(
        "Electronic payment operator (Stripe) — to process payments.",
        "Courier and logistics companies (InPost / DPD / DHL) — to deliver the package.",
        "Accounting office — for store bookkeeping services.",
        "Hosting and e-commerce platform providers supporting the store."
      )
    ),
    section(
      "§ 4. Data Retention Period",
      paragraph(
        "Personal data will be stored for the period necessary to execute the sales contract, and thereafter for a period corresponding to the statute of limitations for claims (usually 6 years for tax and accounting purposes) or until consent is withdrawn in the case of the Newsletter."
      )
    ),
    section(
      "§ 5. Customer Rights",
      paragraph("Every Customer has the right to:"),
      bullets(
        "Access their data and receive a copy.",
        "Rectify (correct) their data.",
        "Erase data (“the right to be forgotten”) — if there are no other legal grounds for processing.",
        "Restrict processing or object to processing.",
        "Withdraw consent at any time.",
        "Lodge a complaint with the President of the Personal Data Protection Office (UODO) or the local supervisory authority."
      ),
      paragraph("To exercise the above rights, please contact: ", mail(CONTACT_EMAIL))
    ),
    section(
      "§ 6. Cookie Policy",
      paragraph(
        "The online store saves information on the Customer’s device (cookies and browser storage) under Art. 399 of the Polish Electronic Communications Law."
      ),
      paragraph("This information is used to:"),
      bullets(
        "Maintain the Customer’s session, cart and checkout — necessary for the store to work.",
        "Remember preferences the Customer sets themselves (currency, wishlist)."
      ),
      paragraph(
        "The store does not use analytics or marketing trackers. Should that change, they will only run after the Customer opts in, and the choice can be withdrawn at any time."
      ),
      paragraph(
        "A full list, together with the settings panel, is available in the ",
        link("Cookie Policy", "/cookies"),
        ". Cookies can also be blocked in the browser settings."
      )
    ),
  ],
  pl: [
    section(
      "§ 1. Postanowienia ogólne",
      paragraph(
        `Administratorem danych osobowych zbieranych za pośrednictwem Sklepu Internetowego jest ${STUDIO_NAME}, ${STUDIO_ADDRESS_PL}. Email: `,
        mail(CONTACT_EMAIL),
        " (dalej jako: „Administrator”)."
      ),
      paragraph(
        "Dane osobowe Klienta są przetwarzane zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) oraz ustawą o ochronie danych osobowych."
      ),
      paragraph(
        "Administrator dokłada szczególnej staranności w celu ochrony interesów osób, których dane dotyczą, zapewniając że dane przetwarzane są zgodnie z prawem."
      )
    ),
    section(
      "§ 2. Cel i podstawa przetwarzania danych",
      paragraph("Dane osobowe Klientów przetwarzane są w następujących celach:"),
      bullets(
        [
          strong("Realizacja zamówienia i umowy sprzedaży"),
          " (art. 6 ust. 1 lit. b RODO) — imię, nazwisko, adres dostawy, e-mail, numer telefonu, NIP (w przypadku firm).",
        ],
        [
          strong("Rozliczenia księgowe i podatkowe"),
          " (art. 6 ust. 1 lit. c RODO) — realizacja obowiązków prawnych.",
        ],
        [
          strong("Ustalenie lub obrona roszczeń"),
          " (art. 6 ust. 1 lit. f RODO) — prawnie uzasadniony interes Administratora.",
        ],
        [
          strong("Marketing bezpośredni / Newsletter"),
          " (art. 6 ust. 1 lit. a RODO) — wyłącznie za zgodą Klienta.",
        ]
      )
    ),
    section(
      "§ 3. Odbiorcy danych",
      paragraph("W celu realizacji zamówienia Administrator może udostępniać dane Klienta:"),
      bullets(
        "Operatorowi płatności Stripe — w celu obsługi płatności.",
        "Firmom kurierskim (InPost / DPD / DHL) — w celu dostarczenia przesyłki.",
        "Biuru rachunkowemu — w celu obsługi księgowej sklepu.",
        "Dostawcy hostingu i systemu e-commerce."
      )
    ),
    section(
      "§ 4. Okres przechowywania danych",
      paragraph(
        "Dane osobowe będą przechowywane przez okres niezbędny do realizacji umowy sprzedaży, a po tym czasie przez okres odpowiadający przedawnieniu roszczeń (zazwyczaj 6 lat dla celów podatkowych i księgowych) lub do momentu wycofania zgody w przypadku Newslettera."
      )
    ),
    section(
      "§ 5. Prawa klienta",
      paragraph("Każdemu Klientowi przysługuje prawo do:"),
      bullets(
        "Wglądu w swoje dane oraz otrzymania ich kopii.",
        "Sprostowania (poprawiania) swoich danych.",
        "Usunięcia danych („prawo do bycia zapomnianym”) — jeśli nie ma innych podstaw prawnych do ich przetwarzania.",
        "Ograniczenia przetwarzania lub wniesienia sprzeciwu.",
        "Cofnięcia zgody w dowolnym momencie.",
        "Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO)."
      ),
      paragraph("W celu skorzystania z powyższych praw prosimy o kontakt: ", mail(CONTACT_EMAIL))
    ),
    section(
      "§ 6. Pliki cookies (ciasteczka)",
      paragraph(
        "Sklep internetowy zapisuje informacje na urządzeniu końcowym Klienta (pliki cookies i pamięć przeglądarki) na zasadach określonych w art. 399 ustawy Prawo komunikacji elektronicznej."
      ),
      paragraph("Informacje te wykorzystywane są w celu:"),
      bullets(
        "Utrzymania sesji Klienta, koszyka i procesu zamówienia — są niezbędne do działania sklepu.",
        "Zapamiętania preferencji ustawionych samodzielnie przez Klienta (waluta, lista ulubionych)."
      ),
      paragraph(
        "Sklep nie korzysta z narzędzi analitycznych ani marketingowych. Jeżeli to się zmieni, będą one uruchamiane wyłącznie po wyrażeniu zgody przez Klienta, a zgodę można w każdej chwili wycofać."
      ),
      paragraph(
        "Pełna lista wraz z panelem ustawień znajduje się w ",
        link("Polityce cookies", "/cookies"),
        ". Pliki cookies można również zablokować w ustawieniach przeglądarki."
      )
    ),
  ],
};
