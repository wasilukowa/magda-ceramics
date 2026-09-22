import { AboutByLocale } from "./types";

// Tekst ze strony „O mnie", w obu językach — odwzorowany co do słowa
// z dokumentu, który napisała Magda („Magda Ceramics Introduction").
//
// ‼️ MAGDA: obie wersje są Twoje i NIE SĄ swoimi tłumaczeniami zdanie
// w zdanie — polska mówi kilka rzeczy, których angielska nie mówi, i tak ma
// zostać. Poprawione zostały tylko trzy rzeczy: „come the the" → „come to
// the", podwójne spacje, oraz nazwa na Instagramie — w dokumencie stało
// „@Magda Ceramics", a Twój profil nazywa się @magda_ceramics, więc ktoś
// szukający po tej pierwszej nazwie nic by nie znalazł.
//
// Zdjęcia stoją tam, gdzie wstawiłaś je w dokumencie. Ścieżki i wymiary są
// zebrane niżej w jednym miejscu, żeby podmiana pliku nie wymagała szukania
// go w dwóch wersjach językowych; przy stronie zostaje tylko opis zdjęcia,
// bo ten jest inny po polsku i po angielsku.
//
// ‼️ BRAKUJE JEDNEGO: w dokumencie jest w tym miejscu notatka „(Tu będzie
// zdjęcie kuchni, która musze sprzątnąć ;))". Akapit o pracowni w kuchni
// czeka więc bez zdjęcia — gdy przyślesz, wystarczy dołożyć je do grupy
// `photos` pod tym akapitem.
const PHOTO = {
  portrait: { src: "/o-mnie/magda-portret.jpg", width: 431, height: 539 },
  mark: { src: "/o-mnie/znak-na-spodzie.jpg", width: 473, height: 473 },
  earlyPumpkin: { src: "/o-mnie/pierwsze-prace-dynia.jpg", width: 603, height: 603 },
  earlyMug: { src: "/o-mnie/pierwsze-prace-kubek.jpg", width: 610, height: 610 },
  throwing: { src: "/o-mnie/proces-toczenie.jpg", width: 442, height: 442 },
  trimming: { src: "/o-mnie/proces-trymowanie.jpg", width: 445, height: 445 },
  handle: { src: "/o-mnie/proces-ucho.jpg", width: 442, height: 442 },
  foot: { src: "/o-mnie/proces-stopka.jpg", width: 447, height: 447 },
  carving: { src: "/o-mnie/proces-rzezbienie.jpg", width: 451, height: 451 },
  finished: { src: "/o-mnie/proces-gotowy-kubek.jpg", width: 449, height: 449 },
} as const;

export const ABOUT: AboutByLocale = {
  en: {
    blocks: [
      {
        type: "photos",
        photos: [{ ...PHOTO.portrait, alt: "Magda drinking from one of her own mugs" }],
      },
      { type: "paragraph", text: "Hello, I'm Magda." },
      { type: "paragraph", text: "Welcome to my creative, dusty little world :)" },
      {
        type: "paragraph",
        text: "I live in Warsaw, Poland, with my husband and our teenage son. In a world that often feels busy and fast, pottery gives me a reason to slow down — to be present, to enjoy the quiet rhythm of making something with my hands.",
      },
      {
        type: "paragraph",
        text: "Clay has become my anchor: a place where time seems to move a little differently, and always far too quickly.",
      },
      { type: "heading", text: "How it started" },
      {
        type: "paragraph",
        text: "In 2023, I was looking for a way to quiet my mind. I signed up for a pottery class at a local community studio and never imagined how far a single handful of clay could take me. The first time I touched the wheel, everything changed. What began as a way to slow down became a passion — and then Magda Ceramics was born.",
      },
      {
        type: "photos",
        photos: [{ ...PHOTO.mark, alt: "A mark carved into the unfired foot of a mug" }],
      },
      {
        type: "paragraph",
        text: "My earliest pieces were clumsy, pinched forms that looked like a child's work. I keep them because they remind me where it all began: curious hands and a lot of joy.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.earlyPumpkin, alt: "A small glazed pumpkin beside a sunflower" },
          { ...PHOTO.earlyMug, alt: "A mug glazed in deep blue" },
        ],
      },
      {
        type: "paragraph",
        text: "Since I could only come to the pottery classes once a week, I bought my own wheel and built a studio at home in my tiny kitchen. This is the place where all my pots are created.",
      },
      {
        type: "paragraph",
        text: "I love every step of the creative process: the rhythm of throwing, the patience of trimming, quiet sound of carving, the suspense of the glaze, the joy of photographing the finished piece.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.throwing, alt: "Magda's hands raising a wall of clay on the wheel" },
          { ...PHOTO.trimming, alt: "Trimming a leather-hard mug on the wheel" },
          { ...PHOTO.handle, alt: "Shaping the handle of a mug by hand" },
          { ...PHOTO.foot, alt: "Working the foot of a mug with a wooden tool" },
          { ...PHOTO.carving, alt: "Carving a pattern into leather-hard clay" },
          { ...PHOTO.finished, alt: "A finished glazed mug beside scattered coffee beans" },
        ],
      },
      { type: "heading", text: "One of one" },
      {
        type: "paragraph",
        text: "I have too many ideas to stay in one place, so I experiment and follow my curiosity. No two pieces are ever alike — every mug, bowl, and vase keeps its own shape, its own imperfections, its own story.",
      },
      {
        type: "paragraph",
        text: "For me, pottery is about so much more than the final object. It is about uncovering the beauty in simplicity, romanticizing the imperfect, and crafting timeless pieces that are truly meant to last.",
      },
      {
        type: "paragraph",
        text: "But beyond the clay, this journey has brought another unexpected gift: the wonderful community and deep friendships I have found through sharing my work on Instagram @magda_ceramics.",
      },
      {
        type: "paragraph",
        text: "Thank you so much for being part of this pottery journey. I hope you find something special here — for yourself, or for someone you love.",
      },
    ],
    signature: "Warmly,\nMagda",
  },
  pl: {
    blocks: [
      {
        type: "photos",
        photos: [{ ...PHOTO.portrait, alt: "Magda pijąca z własnoręcznie zrobionego kubka" }],
      },
      { type: "paragraph", text: "Cześć, jestem Magda." },
      { type: "paragraph", text: "Witaj w moim kreatywnym, nieco zakurzonym świecie :)" },
      {
        type: "paragraph",
        text: "Mieszkam w Warszawie z mężem i nastoletnim synem. W świecie, który tak często pędzi i przytłacza, ceramika daje mi powód, by zwolnić – by być tu i teraz, by cieszyć się spokojnym rytmem tworzenia własnymi rękami.",
      },
      {
        type: "paragraph",
        text: "Glina stała się moją kotwicą: miejscem, w którym czas płynie zupełnie inaczej i zawsze zdecydowanie za szybko ;)",
      },
      { type: "heading", text: "Jak to się zaczęło" },
      {
        type: "paragraph",
        text: "W 2023 roku szukałam sposobu na wyciszenie głowy. Zapisałam się na warsztaty w lokalnej pracowni i nawet nie podejrzewałam, w jak daleką podróż zabierze mnie jedna garść gliny. Kiedy pierwszy raz usiadłam przy kole garncarskim wszystko się zmieniło. To, co zaczęło się jako odskocznia od codzienności, szybko stało się pasją – a z czasem przerodziło w markę Magda Ceramics.",
      },
      {
        type: "photos",
        photos: [{ ...PHOTO.mark, alt: "Znak wyryty w niewypalonej stopce kubka" }],
      },
      {
        type: "paragraph",
        text: "Moje pierwsze prace były niezdarne, ręcznie ulepione i wyglądały jak przedszkolne wprawki. Trzymam je jednak z sentymentem, bo przypominają mi o moich początkach: o ciekawskich dłoniach i czystej, dziecięcej radości tworzenia.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.earlyPumpkin, alt: "Mała szkliwiona dynia obok słonecznika" },
          { ...PHOTO.earlyMug, alt: "Kubek w głębokim granacie" },
        ],
      },
      {
        type: "paragraph",
        text: "Ponieważ na zajęcia w pracowni mogłam chodzić tylko raz w tygodniu, szybko kupiłam własne koło i stworzyłam miniaturowe studio w... mojej maleńkiej kuchni.",
      },
      {
        type: "paragraph",
        text: "Uwielbiam każdy etap tego procesu: hipnotyzujący rytm toczenia na kole, pełne uważności i cierpliwości trymowanie, cichy dźwięk rzeźbienia w glinie, dreszczyk emocji podczas otwierania pieca ze szkliwami i wreszcie – uwiecznianie gotowego naczynia na fotografiach.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.throwing, alt: "Dłonie Magdy wyciągające ściankę naczynia na kole" },
          { ...PHOTO.trimming, alt: "Trymowanie podeschniętego kubka na kole" },
          { ...PHOTO.handle, alt: "Ręczne formowanie ucha kubka" },
          { ...PHOTO.foot, alt: "Opracowywanie stopki kubka drewnianym narzędziem" },
          { ...PHOTO.carving, alt: "Rzeźbienie wzoru w podeschniętej glinie" },
          { ...PHOTO.finished, alt: "Gotowy, oszkliwiony kubek obok rozsypanych ziaren kawy" },
        ],
      },
      { type: "heading", text: "Jedyne w swoim rodzaju" },
      {
        type: "paragraph",
        text: "W mojej głowie bez przerwy rodzą się nowe pomysły, dlatego nie potrafię stać w miejscu. Ciągle eksperymentuję i daję się prowadzić własnej ciekawości.",
      },
      {
        type: "paragraph",
        text: "Nie ma u mnie dwóch takich samych prac – każdy kubek, miska czy wazon ma swój własny kształt, drobne niedoskonałości i unikalną historię.",
      },
      {
        type: "paragraph",
        text: "Dla mnie ceramika to coś znacznie więcej niż tylko gotowy przedmiot. To lekcja ogromnej cierpliwości, której glina wymaga na każdym etapie tworzenia. To także odnajdywanie piękna w prostocie, celebrowanie unikalności i tworzenie rzeczy z duszą, które mają przetrwać lata.",
      },
      {
        type: "paragraph",
        text: "Jednak poza samą gliną, ta droga przyniosła mi jeszcze jeden, niezwykły prezent: wspaniałą społeczność i piękne, bliskie przyjaźnie, które zrodziły się dzięki dzieleniu się moją pasją na Instagramie @magda_ceramics.",
      },
      {
        type: "paragraph",
        text: "Dziękuję Wam WSZYSTKIM, że jesteście częścią tej podróży.",
      },
      {
        type: "paragraph",
        text: "Mam nadzieję, że znajdziecie tutaj coś wyjątkowego – dla siebie lub dla kogoś, kogo kochacie.",
      },
    ],
    signature: "Ciepło pozdrawiam,\nMagda",
  },
};
