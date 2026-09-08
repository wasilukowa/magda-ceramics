import { FaqByLocale } from "./types";

// Pytania, które wracają najczęściej.
//
// ‼️ MAGDA: pozycje z `draft: true` NIE POKAZUJĄ SIĘ na stronie. To pytania,
// na które odpowiedzieć możesz tylko Ty — dopisz odpowiedź i skasuj `draft`,
// a pojawią się same. Reszta jest już prawdziwa: te odpowiedzi wynikają z
// regulaminu, ze strony „Wysyłka i zwroty" i z tego, jak sklep naprawdę
// działa, więc gdy zmienisz tamto, zmień i tutaj.
export const FAQ: FaqByLocale = {
  pl: [
    {
      heading: "Zamówienia i płatności",
      entries: [
        {
          question: "Jak mogę zapłacić?",
          answer: [
            "Płatności obsługuje Stripe. Zapłacisz kartą, BLIKIEM, Apple Pay, Google Pay albo Klarną — pełna lista pokazuje się w kasie, w kroku „Płatność”.",
          ],
        },
        {
          question: "Czy mogę zapłacić w euro?",
          answer: [
            "Tak. Przełącznik PLN / EUR stoi na górze każdej strony, a ceny w euro są ustalone przeze mnie, nie przeliczane po kursie z dnia. Wysyłka poza Polskę też ma własną stawkę w euro.",
          ],
        },
        {
          question: "Czy muszę zakładać konto?",
          answer: [
            "Nie. W kasie wybierasz „Kontynuuj jako gość” i zamawiasz bez konta. Konto przydaje się później: widać w nim stan zamówień i zapamiętuje adres na następny raz.",
          ],
        },
        {
          question: "Płatność się nie udała. Co teraz?",
          answer: [
            "Nic nie przepadło — dopóki płatność nie przejdzie, praca nie jest sprzedana nikomu innemu. Spróbuj jeszcze raz z kasy, a jeśli coś dalej nie działa, napisz do mnie i sprawdzę, na czym stanęło.",
          ],
          moreRoute: "/contact",
        },
      ],
    },
    {
      heading: "Wysyłka",
      entries: [
        {
          question: "Kiedy wyślesz moje zamówienie?",
          answer: [
            "Paczkę przygotowuję w 3–5 dni roboczych od zaksięgowania wpłaty. Do tego dochodzi czas przewoźnika.",
          ],
          moreRoute: "/shipping",
        },
        {
          question: "Dokąd wysyłasz?",
          answer: [
            "Do Polski i do krajów Unii Europejskiej. Tam, gdzie InPost ma paczkomaty, w kasie pokazuje się mapa i możesz wybrać punkt odbioru; w pozostałych krajach paczkę wiezie kurier pod adres.",
          ],
          moreRoute: "/shipping",
        },
        {
          question: "Ile kosztuje wysyłka?",
          answer: [
            "Stawka zależy od kraju i jest stała — widzisz ją w podsumowaniu zamówienia, zanim cokolwiek zapłacisz. Pełną tabelę trzymam na osobnej stronie.",
          ],
          moreRoute: "/shipping",
        },
      ],
    },
    {
      heading: "Zwroty i reklamacje",
      entries: [
        {
          question: "Czy mogę zwrócić zakupioną pracę?",
          answer: [
            "Tak, masz na to 14 dni od odebrania przesyłki i nie musisz podawać powodu. Zwracam wtedy całą zapłatę razem z kosztem najtańszej dostawy, jaką oferowałam.",
            "Wyjątkiem są prace robione na indywidualne zamówienie — te z natury nie nadają się do odesłania.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
        {
          question: "Praca dojechała pęknięta. Co robić?",
          answer: [
            "Jeśli karton jest widocznie uszkodzony, poproś kuriera o protokół szkody, a potem napisz do mnie i dołącz zdjęcia. Reklamację rozpatruję w ciągu 14 dni.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
      ],
    },
    {
      heading: "O pracach",
      entries: [
        {
          question: "Czy dostanę dokładnie to, co widzę na zdjęciu?",
          answer: [
            "Tak. Każdą pracę rzeźbię i maluję ręcznie, więc nie ma dwóch takich samych — zdjęcia w sklepie to zawsze ten konkretny egzemplarz, który do Ciebie pojedzie.",
          ],
        },
        {
          question: "Czy mogę myć ceramikę w zmywarce?",
          answer: [],
          draft: true,
        },
        {
          question: "Czy naczynia nadają się do mikrofalówki?",
          answer: [],
          draft: true,
        },
        {
          question: "Jak dbać o ręcznie robioną ceramikę?",
          answer: [],
          draft: true,
        },
        {
          question: "Czy przyjmujesz zamówienia indywidualne?",
          answer: [],
          draft: true,
        },
      ],
    },
  ],
  en: [
    {
      heading: "Orders and payment",
      entries: [
        {
          question: "How can I pay?",
          answer: [
            "Payments go through Stripe. You can pay by card, BLIK, Apple Pay, Google Pay or Klarna — the full list appears at the Payment step of the checkout.",
          ],
        },
        {
          question: "Can I pay in euro?",
          answer: [
            "Yes. The PLN / EUR switch sits at the top of every page, and the euro prices are ones I set myself rather than a daily conversion. Shipping outside Poland has its own euro rate too.",
          ],
        },
        {
          question: "Do I need an account?",
          answer: [
            "No. Choose “Continue as guest” at the checkout and order without one. An account is useful later: it shows where your orders stand and remembers your address for next time.",
          ],
        },
        {
          question: "My payment failed. What now?",
          answer: [
            "Nothing is lost — until a payment goes through, the piece is not sold to anyone else. Try again from the checkout, and if something still will not work, write to me and I will find out where it stopped.",
          ],
          moreRoute: "/contact",
        },
      ],
    },
    {
      heading: "Shipping",
      entries: [
        {
          question: "When will you send my order?",
          answer: [
            "I prepare the parcel within 3–5 working days of the payment being credited. The carrier's own transit time comes on top of that.",
          ],
          moreRoute: "/shipping",
        },
        {
          question: "Where do you ship?",
          answer: [
            "To Poland and to countries in the European Union. Where InPost has parcel lockers the checkout shows a map and you can pick a collection point; everywhere else a courier brings the parcel to your address.",
          ],
          moreRoute: "/shipping",
        },
        {
          question: "How much is shipping?",
          answer: [
            "The rate depends on the country and is a flat one — you see it in the order summary before you pay anything. The full table lives on its own page.",
          ],
          moreRoute: "/shipping",
        },
      ],
    },
    {
      heading: "Returns and complaints",
      entries: [
        {
          question: "Can I return a piece?",
          answer: [
            "Yes — you have 14 days from receiving the parcel and you do not have to give a reason. I refund everything you paid, including the cost of the cheapest delivery I offered.",
            "The exception is work made to a personal order; by its nature that cannot go back.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
        {
          question: "My piece arrived cracked. What should I do?",
          answer: [
            "If the box is visibly damaged, ask the courier for a damage report, then write to me with photos. I answer complaints within 14 days.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
      ],
    },
    {
      heading: "About the pieces",
      entries: [
        {
          question: "Will I get exactly what I see in the photo?",
          answer: [
            "Yes. Every piece is carved and painted by hand, so no two are alike — the photos in the shop are always of the very piece that will travel to you.",
          ],
        },
        {
          question: "Is your ceramic dishwasher safe?",
          answer: [],
          draft: true,
        },
        {
          question: "Can I use these pieces in the microwave?",
          answer: [],
          draft: true,
        },
        {
          question: "How should I care for handmade ceramics?",
          answer: [],
          draft: true,
        },
        {
          question: "Do you take custom orders?",
          answer: [],
          draft: true,
        },
      ],
    },
  ],
};
