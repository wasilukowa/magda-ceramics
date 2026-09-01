import { AboutByLocale } from "./types";

// Tekst ze strony „O mnie", w obu językach. Przepisany co do znaku z wersji,
// która wcześniej siedziała wprost w komponencie — poprawka w opowieści Magdy
// nie wymaga już dotykania JSX-a. Uwaga: wersje NIE SĄ swoimi tłumaczeniami
// zdanie w zdanie; obie napisała Magda i każda brzmi po swojemu.
export const ABOUT: AboutByLocale = {
  en: {
    paragraphs: [
      "Hello! I'm so glad you're here :)",
      "My name is Magda, and I'd like to welcome you to my creative – and usually very dusty – world. I live in Warsaw, Poland, with my husband Tomasz and our teenage son Kuba.",
      "In a world full of constant noise and a fast-paced lifestyle, working with clay is what keeps me grounded. I simply love the entire process of creation, whether I'm shaping a large vase or molding a tiny, cute mini pot.",
      "My journey with clay began in late 2023 when I was searching for an engaging hobby, and I got hooked instantly. In 2026, I set up a tiny, cozy pottery studio right in the corner of my kitchen. This is where the magic happens: spinning the pottery wheel, experimenting with different types of clay, and letting my imagination run wild. I am absolutely in love with carving and painting ceramics, which is why no two pieces of mine are ever alike.",
      "I hope you enjoy spending time here and find something truly unique for yourself or your loved ones.",
      "Thank you for being a part of my journey.",
    ],
    signature: "Magda",
  },
  pl: {
    paragraphs: [
      "Cześć! Bardzo się cieszę, że tu trafiliście :)",
      "Nazywam się Magda i witam Was w moim pełnym pasji, twórczego nieładu i – nie ukrywajmy – wszechobecnego pyłu świecie. Na co dzień mieszkam w Warszawie razem z mężem Tomaszem i naszym nastoletnim synem Kubą.",
      "Gdy wokół panuje szum, a życie pędzi jak szalone, glina staje się moją bezpieczną przystanią. To ona daje mi wewnętrzny spokój.",
      "Moja ceramiczna ścieżka rozpoczęła się pod koniec 2023 roku, kiedy szukałam zajęcia dla rąk i głowy, a znalazłam miłość od pierwszego dotknięcia. W 2026 roku udało mi się wyczarować mini-pracownię w rogu własnej kuchni. To tu, przy szumie koła garncarskiego i eksperymentach z fakturami, uwalniam wyobraźnię. Ponieważ każde naczynie rzeźbię i maluję ręcznie, nie znajdziecie u mnie dwóch identycznych rzeczy.",
      "Rozgośćcie się i mam nadzieję, że odkryjecie tu coś unikalnego dla siebie lub bliskich.",
      "Dziękuję, że towarzyszycie mi w tej pięknej przygodzie.",
    ],
    signature: "Magda",
  },
};
