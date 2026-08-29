import { LegalDocumentByLocale } from "@/content/types";
import { CONTACT_EMAIL, STUDIO_ADDRESS_EN, STUDIO_ADDRESS_PL } from "@/content/data";
import {
  anchoredSection,
  link,
  mail,
  paragraph,
  section,
  strong,
} from "@/lib/helpers/legal";

// Strona „Wysyłka i zwroty" — streszczenie § 4, § 5 i § 6 regulaminu napisane
// tak, żeby dało się je przeczytać przed zakupem. Regulamin zostaje źródłem
// prawdy: każda zmiana terminu czy zasady musi trafić w OBA miejsca.
// Dokument jest rozbity na dwie części, bo między nie wchodzi tabela stawek
// liczona z SHIPPING_RATES.

export const SHIPPING_INTRO: LegalDocumentByLocale = {
  en: [
    section(
      "How the parcels travel",
      paragraph(
        "Every piece is wrapped by hand with plenty of filling — ceramics are fragile and we would rather use one box too many than one too few."
      ),
      paragraph(
        "Orders are prepared within 3–5 business days of the payment being credited, unless the description of a particular product says otherwise. The carrier’s own transit time is added to that."
      ),
      paragraph(
        "The studio ships within Poland and the European Union. Destinations outside the EU are not available — shipping there costs more than the ceramics are worth."
      )
    ),
  ],
  pl: [
    section(
      "Jak jadą paczki",
      paragraph(
        "Każdą pracę pakujemy ręcznie, z zapasem wypełniacza — ceramika jest krucha i wolimy dołożyć jedno pudełko za dużo niż za mało."
      ),
      paragraph(
        "Zamówienie przygotowujemy w 3–5 dni roboczych od zaksięgowania wpłaty, chyba że opis konkretnego produktu mówi inaczej. Do tego dochodzi czas transportu po stronie przewoźnika."
      ),
      paragraph(
        "Wysyłamy na terenie Polski i Unii Europejskiej. Kierunków spoza UE nie obsługujemy — przesyłka kosztowałaby tam więcej niż sama ceramika."
      )
    ),
  ],
};

export const SHIPPING_DETAILS: LegalDocumentByLocale = {
  en: [
    section(
      "InPost parcel lockers",
      paragraph(
        "Where InPost lockers are available, the checkout shows a map: pick a locker and its code travels with the order, so the parcel is sent exactly where it is convenient to collect it."
      ),
      paragraph(
        "Everywhere else the parcel goes to the address typed in at checkout."
      )
    ),
    anchoredSection(
      "returns",
      "Returns",
      paragraph(
        "A consumer may withdraw from the purchase without giving any reason within 14 days of receiving the parcel."
      ),
      paragraph("It is enough to write to ", mail(CONTACT_EMAIL), " and say so."),
      paragraph(
        `The product then goes back at the customer’s own expense, within 14 days of that message, to: ${STUDIO_ADDRESS_EN}.`
      ),
      paragraph(
        strong("Please pack it well."),
        " Ceramics survive the journey back only with proper filling — ideally the packaging it arrived in. Damage caused by careless packing reduces the refund."
      ),
      paragraph(
        "All payments are refunded within 14 days of the statement or of the goods coming back, including the cost of the cheapest delivery option offered."
      ),
      paragraph(
        strong("Exception:"),
        " pieces made to an individual order (personalised text or design) cannot be returned this way."
      ),
      paragraph("The full wording is in ", link("§ 5 of the Terms", "/terms", "returns"), ".")
    ),
    section(
      "Complaints and transport damage",
      paragraph(
        "If a piece arrives cracked or the box is visibly damaged, ask the courier for a damage report and write to ",
        mail(CONTACT_EMAIL),
        " — photos help a great deal."
      ),
      paragraph(
        "Complaints are answered within 14 days, with a replacement, a repair, a price reduction or a refund."
      ),
      paragraph("The full wording is in ", link("§ 6 of the Terms", "/terms", "complaints"), ".")
    ),
  ],
  pl: [
    section(
      "Paczkomaty InPost",
      paragraph(
        "Tam, gdzie InPost ma paczkomaty, w kasie pokazuje się mapa: wybrany punkt jedzie razem z zamówieniem, więc paczka trafia dokładnie tam, gdzie wygodnie ją odebrać."
      ),
      paragraph("W pozostałych krajach przesyłka idzie na adres podany w zamówieniu.")
    ),
    anchoredSection(
      "returns",
      "Zwroty",
      paragraph(
        "Konsument może odstąpić od zakupu bez podawania przyczyny w ciągu 14 dni od odebrania przesyłki."
      ),
      paragraph("Wystarczy napisać na ", mail(CONTACT_EMAIL), "."),
      paragraph(
        `Produkt wraca na koszt klienta, w ciągu 14 dni od tej wiadomości, na adres: ${STUDIO_ADDRESS_PL}.`
      ),
      paragraph(
        strong("Prosimy o solidne zapakowanie."),
        " Ceramika przetrwa drogę powrotną tylko z porządnym wypełnieniem — najlepiej w opakowaniu, w którym przyjechała. Uszkodzenie z powodu niedbałego pakowania pomniejsza zwrot."
      ),
      paragraph(
        "Wszystkie płatności zwracamy w ciągu 14 dni od oświadczenia albo od powrotu towaru, razem z kosztem najtańszej oferowanej dostawy."
      ),
      paragraph(
        strong("Wyjątek:"),
        " prace wykonane na indywidualne zamówienie (personalizowany napis albo wzór) nie podlegają zwrotowi w tym trybie."
      ),
      paragraph("Pełna treść: ", link("§ 5 regulaminu", "/terms", "returns"), ".")
    ),
    section(
      "Reklamacje i uszkodzenia w transporcie",
      paragraph(
        "Jeśli praca dojedzie pęknięta albo karton jest widocznie uszkodzony, poproś kuriera o protokół szkody i napisz na ",
        mail(CONTACT_EMAIL),
        " — zdjęcia bardzo pomagają."
      ),
      paragraph(
        "Reklamację rozpatrujemy w ciągu 14 dni: wymiana, naprawa, obniżenie ceny albo zwrot pieniędzy."
      ),
      paragraph("Pełna treść: ", link("§ 6 regulaminu", "/terms", "complaints"), ".")
    ),
  ],
};
