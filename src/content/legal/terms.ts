import { LegalDocumentByLocale } from "@/content/types";
import {
  CONTACT_EMAIL,
  STUDIO_ADDRESS_EN,
  STUDIO_ADDRESS_PL,
  STUDIO_NAME,
} from "@/content/data";
import {
  anchoredSection,
  bullets,
  link,
  mail,
  paragraph,
  placeholder,
  section,
  strong,
} from "@/lib/helpers/legal";

// Regulamin sklepu. Treść jest wiążąca prawnie — poprawki wprowadzać w obu
// językach naraz i pamiętać o dacie wejścia w życie w § 8.
// Kotwice „delivery" i „returns" są linkowane ze stopki i ze strony
// „Wysyłka i zwroty" — nie zmieniać ich nazw bez poprawienia tamtych linków.
export const TERMS: LegalDocumentByLocale = {
  en: [
    section(
      "§ 1. General Provisions",
      paragraph(
        `The online store operating at www.magdaceramics.com is operated by: ${STUDIO_NAME}, ${STUDIO_ADDRESS_EN}, as an unregistered business activity.`
      ),
      paragraph(
        "These Terms and Conditions define the rules for using the Store, placing orders, delivering products, the right to withdraw from the contract, and complaint procedures."
      ),
      paragraph(
        "All products offered in the Store are brand new and handmade (handicraft). Due to the nature of handmade production, individual items may slightly differ in dimensions, color shades, or minor details. This constitutes their unique character and is not considered a product defect."
      ),
      paragraph("The Seller can be contacted via email at: ", mail(CONTACT_EMAIL))
    ),
    section(
      "§ 2. Electronically Supplied Services",
      paragraph(
        "The Seller provides electronic services enabling the Customer to place an order via the Order Form."
      ),
      paragraph(
        "This service is provided free of charge and is a one-time service. It terminates when the order is placed or when the Customer stops placing it."
      )
    ),
    section(
      "§ 3. Placing and Fulfilling Orders",
      paragraph("Customers can place an order as a guest or by creating an account in the Store."),
      paragraph(
        "To place an order, select the products, add them to the cart, fill out the delivery form, and choose a payment method."
      ),
      paragraph(
        "The condition for fulfilling the order is clicking the “Buy and Pay” button and paying for the order within the specified period."
      ),
      paragraph(
        "All prices in the Store are gross prices (including taxes) in Polish Zlotys (PLN). Prices do not include delivery costs, which are added during the checkout process."
      ),
      paragraph(
        "After placing an order, the Customer receives an automatic email confirming that the order has been accepted for processing. At this moment, the sales contract is concluded."
      )
    ),
    anchoredSection(
      "delivery",
      "§ 4. Payments and Delivery",
      paragraph("The Seller provides the following payment methods:"),
      bullets(
        "Card payments, BLIK, Apple Pay, Google Pay via Stripe.",
        [
          "Traditional bank transfer to account: ",
          placeholder("[bank account number — to be provided]"),
        ]
      ),
      paragraph("Available delivery methods:"),
      bullets(
        "Domestic delivery (Poland): InPost / DPD / DHL.",
        "International delivery: DHL Express / Polish Post."
      ),
      paragraph(
        "Delivery costs are covered by the Buyer unless promotional terms state otherwise."
      ),
      paragraph(
        "Order fulfillment time (preparing and safely packing the ceramics) takes up to 3–5 business days from the moment the payment is credited, unless the description of a specific product states otherwise. Shipping time by the carrier should be added to this period."
      ),
      paragraph(
        "Current rates per destination are listed on the ",
        link("Shipping and returns", "/shipping"),
        " page."
      )
    ),
    anchoredSection(
      "returns",
      "§ 5. Right of Withdrawal (Returns)",
      paragraph(
        "A Consumer has the right to withdraw from the sales contract without giving any reason within 14 days from the day of receiving the package."
      ),
      paragraph(
        "To exercise this right, the Customer must inform the Seller by an unequivocal statement (e.g., by sending an email to ",
        mail(CONTACT_EMAIL),
        ")."
      ),
      paragraph(
        `The Customer is obliged to send the product back at their own expense to: ${STUDIO_ADDRESS_EN}, within 14 days of notifying the Seller.`
      ),
      paragraph(
        strong("Note (Ceramics):"),
        " Due to the delicate nature of the products, the Customer is required to pack the returned ceramics securely (it is recommended to use the original packaging and fillers). The Customer is liable for any diminished value resulting from handling beyond what is necessary to assess the product."
      ),
      paragraph(
        "The Seller shall refund all payments, including the costs of the cheapest available delivery, within 14 days of receiving the statement or the physical return of the goods."
      ),
      paragraph(
        strong("Exception:"),
        " The right of withdrawal does not apply to products made to the Customer’s individual specifications (e.g., ceramics with personalized text or designs)."
      )
    ),
    anchoredSection(
      "complaints",
      "§ 6. Complaints and Warranty",
      paragraph(
        "The Seller is obliged to deliver a product free of defects and is liable for any lack of conformity under applicable consumer protection laws."
      ),
      paragraph(
        "In the event of a product defect (e.g., a crack that occurred before delivery), the Customer has the right to file a complaint."
      ),
      paragraph(
        "Complaints should be reported by email to ",
        mail(CONTACT_EMAIL),
        ", describing the defect and, if possible, attaching photos."
      ),
      paragraph(
        "In the case of visible damage caused by the courier, it is recommended to draw up a damage report in the presence of the courier and immediately contact the Seller."
      ),
      paragraph(
        "The Seller will consider the complaint within 14 days and inform the Customer of the resolution (replacement, repair, price reduction, or refund)."
      )
    ),
    section(
      "§ 7. Personal Data Protection (GDPR)",
      paragraph("The Seller is the administrator of the Customers’ personal data."),
      paragraph(
        "Personal data is processed solely for the purpose of fulfilling orders and (if the Customer consents) for marketing purposes."
      ),
      paragraph(
        "Detailed rules on data protection and cookie policy can be found in the ",
        link("Privacy Policy", "/privacy"),
        " available on the Store’s website."
      )
    ),
    section(
      "§ 8. Final Provisions",
      paragraph("These Terms and Conditions enter into force on May 28, 2026."),
      paragraph(
        "In matters not regulated herein, the relevant provisions of Polish and European consumer law shall apply."
      ),
      paragraph(
        "The Seller reserves the right to amend these Terms and Conditions. Orders placed before the amendment will be governed by the version in force on the day the order was placed."
      )
    ),
  ],
  pl: [
    section(
      "§ 1. Postanowienia ogólne",
      paragraph(
        `Sklep internetowy działający pod adresem www.magdaceramics.com prowadzony jest przez ${STUDIO_NAME}, ${STUDIO_ADDRESS_PL}, w ramach działalności nierejestrowanej.`
      ),
      paragraph(
        "Niniejszy Regulamin określa zasady korzystania ze Sklepu, składania zamówień, dostarczania produktów, prawa do odstąpienia od umowy oraz procedury reklamacyjne."
      ),
      paragraph(
        "Wszystkie produkty oferowane w Sklepie są fabrycznie nowe, wykonane ręcznie (rękodzieło). Ze względu na specyfikę produkcji ręcznej, poszczególne egzemplarze mogą nieznacznie różnić się wymiarami, odcieniem barw czy drobnymi detalami — stanowi to o ich unikalnym charakterze i nie jest wadą produktu."
      ),
      paragraph(
        "Kontakt ze Sprzedawcą jest możliwy za pośrednictwem adresu e-mail: ",
        mail(CONTACT_EMAIL)
      )
    ),
    section(
      "§ 2. Usługi świadczone drogą elektroniczną",
      paragraph(
        "Sprzedawca świadczy drogą elektroniczną usługi w zakresie umożliwienia Klientowi złożenia zamówienia poprzez Formularz Zamówienia."
      ),
      paragraph(
        "Usługa ta świadczona jest nieodpłatnie i ma charakter jednorazowy. Ulega zakończeniu z chwilą złożenia zamówienia albo zaprzestania jego składania przez Klienta."
      )
    ),
    section(
      "§ 3. Składanie i realizacja zamówień",
      paragraph("Klient może złożyć zamówienie jako gość lub założyć konto w Sklepie."),
      paragraph(
        "W celu złożenia zamówienia należy wybrać produkty, dodać je do koszyka, wypełnić formularz dostawy oraz wybrać metodę płatności."
      ),
      paragraph(
        "Warunkiem realizacji zamówienia jest kliknięcie przycisku „Kupuję i płacę” oraz opłacenie zamówienia w wyznaczonym terminie."
      ),
      paragraph(
        "Wszystkie ceny podane w Sklepie są cenami brutto (zawierają podatki) podanymi w polskich złotych (PLN). Ceny nie zawierają kosztów dostawy, które są doliczane w procesie składania zamówienia."
      ),
      paragraph(
        "Po złożeniu zamówienia Klient otrzymuje automatyczną wiadomość e-mail potwierdzającą przyjęcie zamówienia do realizacji. W tym momencie dochodzi do zawarcia umowy sprzedaży."
      )
    ),
    anchoredSection(
      "delivery",
      "§ 4. Płatności i dostawa",
      paragraph("Sprzedawca udostępnia następujące formy płatności:"),
      bullets(
        "Płatności kartą, BLIK, Apple Pay, Google Pay za pośrednictwem operatora Stripe.",
        [
          "Tradycyjny przelew bankowy na konto o numerze: ",
          placeholder("[numer konta — do uzupełnienia]"),
        ]
      ),
      paragraph("Dostępne metody dostawy:"),
      bullets(
        "Dostawa krajowa: InPost / DPD / DHL.",
        "Dostawa zagraniczna: DHL Express / Poczta Polska."
      ),
      paragraph(
        "Koszt dostawy pokrywa Kupujący, chyba że warunki promocji stanowią inaczej."
      ),
      paragraph(
        "Czas realizacji zamówienia (przygotowanie i bezpieczne zapakowanie ceramiki) wynosi do 3–5 dni roboczych od momentu zaksięgowania wpłaty, chyba że opis konkretnego produktu stanowi inaczej. Do tego czasu należy doliczyć czas transportu przez przewoźnika."
      ),
      paragraph(
        "Aktualne stawki dla poszczególnych kierunków są zebrane na stronie ",
        link("Wysyłka i zwroty", "/shipping"),
        "."
      )
    ),
    anchoredSection(
      "returns",
      "§ 5. Prawo odstąpienia od umowy (zwroty)",
      paragraph(
        "Konsument ma prawo odstąpić od umowy sprzedaży bez podania przyczyny w terminie 14 dni od dnia otrzymania przesyłki."
      ),
      paragraph(
        "Aby skorzystać z tego prawa, Klient musi poinformować Sprzedawcę o swojej decyzji w drodze jednoznacznego oświadczenia (np. wysyłając e-mail na adres ",
        mail(CONTACT_EMAIL),
        ")."
      ),
      paragraph(
        `Klient ma obowiązek odesłać produkt na własny koszt na adres: ${STUDIO_ADDRESS_PL}, w terminie 14 dni od dnia zgłoszenia odstąpienia.`
      ),
      paragraph(
        strong("Uwaga (ceramika):"),
        " Ze względu na delikatny charakter produktów, Klient jest zobowiązany do bezpiecznego zapakowania odsyłanej ceramiki (zaleca się użycie oryginalnych wypełniaczy i kartonu). Klient ponosi odpowiedzialność za zmniejszenie wartości produktu wynikające z korzystania z niego w sposób inny niż było to konieczne do stwierdzenia jego charakteru."
      ),
      paragraph(
        "Sprzedawca zwraca Klientowi wszystkie dokonane płatności, w tym koszt najtańszej dostępnej dostawy, w terminie 14 dni od otrzymania oświadczenia lub fizycznego zwrotu towaru."
      ),
      paragraph(
        strong("Wyjątek:"),
        " Prawo do odstąpienia od umowy nie przysługuje w przypadku produktów wykonanych na specjalne, indywidualne zamówienie Klienta (np. ceramika z personalizowanym napisem/wzorem)."
      )
    ),
    anchoredSection(
      "complaints",
      "§ 6. Reklamacje",
      paragraph(
        "Sprzedawca ma obowiązek dostarczyć produkt wolny od wad i odpowiada za brak zgodności towaru z umową na zasadach określonych w Kodeksie Cywilnym oraz Ustawie o prawach konsumenta."
      ),
      paragraph(
        "W przypadku stwierdzenia wady produktu (np. pęknięcie powstałe przed dostawą) Klient ma prawo złożyć reklamację."
      ),
      paragraph(
        "Reklamację należy zgłosić drogą mailową na adres ",
        mail(CONTACT_EMAIL),
        ", opisując wadę i w miarę możliwości załączając zdjęcia."
      ),
      paragraph(
        "W przypadku widocznego uszkodzenia paczki przez kuriera zaleca się spisanie protokołu szkody i niezwłoczne skontaktowanie się ze Sprzedawcą."
      ),
      paragraph(
        "Sprzedawca rozpatrzy reklamację w terminie 14 dni i poinformuje Klienta o sposobie jej rozwiązania (wymiana, naprawa, obniżenie ceny lub zwrot pieniędzy)."
      )
    ),
    section(
      "§ 7. Ochrona danych osobowych (RODO)",
      paragraph("Administratorem danych osobowych Klientów jest Sprzedawca."),
      paragraph(
        "Dane osobowe przetwarzane są wyłącznie w celu realizacji zamówień oraz (jeśli Klient wyrazi zgodę) w celach marketingowych."
      ),
      paragraph(
        "Szczegółowe zasady ochrony danych oraz polityka plików cookies dostępne są w dokumencie ",
        link("Polityka prywatności", "/privacy"),
        "."
      )
    ),
    section(
      "§ 8. Postanowienia końcowe",
      paragraph("Regulamin wchodzi w życie z dniem 28 maja 2026 r."),
      paragraph(
        "W sprawach nieuregulowanych niniejszym Regulaminem mają zastosowanie powszechnie obowiązujące przepisy prawa polskiego."
      ),
      paragraph(
        "Sprzedawca zastrzega sobie prawo do zmian w Regulaminie. Do zamówień złożonych przed zmianą stosuje się wersję Regulaminu obowiązującą w dniu złożenia zamówienia."
      )
    ),
  ],
};
