import { CeramicsByLocale } from "./types";

// Tekst strony „Moja ceramika" w obu językach — odwzorowany co do słowa
// z dokumentów Magdy („Od surowej kulki gliny do gotowego naczynia" i „From
// a Raw Ball of Clay to a Finished Vessel", 2026-11-04).
//
// ‼️ MAGDA: obie wersje są Twoje i nie są swoimi tłumaczeniami zdanie
// w zdanie (np. w trymowaniu polska mówi o schnięciu pod folią, angielska
// o powolnym schnięciu, żeby nie pękło) — i tak ma zostać. Poprawione zostały
// tylko: „Nastepnie" → „Następnie", przecinek przed „gdzie niespiesznie
// schną" oraz nazwa na Instagramie — w dokumencie stało „@magdaceramics",
// a Twój profil nazywa się @magda_ceramics (tak samo jak na „O mnie").
//
// Zdjęcia stoją tam, gdzie wstawiłaś je w polskim dokumencie; angielski nie
// miał zdjęć, więc dostał te same w tych samych miejscach. Ścieżki i wymiary
// są zebrane niżej w jednym miejscu, przy stronie zostaje tylko opis zdjęcia,
// bo ten jest inny po polsku i po angielsku. Pliki w public/ceramika/,
// pomniejszone do 1600 px. Zdjęcie pracowni to kwadratowy kadr ze zdjęcia
// z telefonu, taki jak w dokumencie.
//
// Zmiany od Natalii po dokumencie (2026-11-04): zdjęcie pracowni przeszło
// wyżej, pod pierwszy akapit; pod „1. Przygotowanie" stoi zamiast niego
// kulka gliny, a polskie zdanie przed nim kończy się na „…który z niego
// powstanie." (bez „czyli jestem tu:").
//
// Do 2026-11-04 na tej stronie stał slider z 17 zdjęciami z pracy przy kole
// (CERAMICS_PHOTOS) i ramka „Właśnie w piecu". Decyzja Natalii: slider na
// razie znika — lista i pliki są w historii gita przed tą zmianą.
const PHOTO = {
  kitchenStudio: { src: "/ceramika/pracownia-w-kuchni.jpg", width: 1600, height: 1600 },
  clayBall: { src: "/ceramika/kulka-gliny.jpg", width: 1600, height: 1600 },
  throwingVase: { src: "/ceramika/toczenie-wazon.jpg", width: 1600, height: 1600 },
  throwingWalls: { src: "/ceramika/toczenie-scianki.jpg", width: 1600, height: 1600 },
  trimming: { src: "/ceramika/trymowanie.jpg", width: 1600, height: 1600 },
  trimmingFoot: { src: "/ceramika/trymowanie-stopka.jpg", width: 1600, height: 1600 },
  carving: { src: "/ceramika/rzezbienie.jpg", width: 1600, height: 1600 },
  drying: { src: "/ceramika/schniecie.jpg", width: 1600, height: 1600 },
  glazedMugs: { src: "/ceramika/szkliwienie-kubki.jpg", width: 1600, height: 1600 },
  glazedPots: { src: "/ceramika/szkliwienie-naczynia.jpg", width: 1600, height: 1600 },
  firedBlue: { src: "/ceramika/po-wypale-niebieskie.jpg", width: 1600, height: 1600 },
  firedStack: { src: "/ceramika/po-wypale-kubki.jpg", width: 1600, height: 1600 },
  thankYou: { src: "/ceramika/podziekowanie.jpg", width: 1600, height: 1600 },
} as const;

export const CERAMICS: CeramicsByLocale = {
  en: {
    title: "From a Raw Ball of Clay to a Finished Vessel – How My Ceramics Are Made",
    blocks: [
      {
        type: "paragraph",
        text: "Every mug, bowl, or vase that finds its way into your hands carries a story written in clay, hands, and fire. The entire process unfolds in my home studio, where everyday living space blends seamlessly with artistic craftsmanship.",
      },
      {
        type: "photos",
        photos: [
          {
            ...PHOTO.kitchenStudio,
            alt: "Magda's home studio in the kitchen: the pottery wheel, a side table and tools",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Here is the journey each piece takes before it makes it to your table:",
      },
      { type: "heading", text: "1. Preparation" },
      {
        type: "paragraph",
        text: "It all begins with a cool, damp ball of clay. I weigh it and wedge it thoroughly to remove any air bubbles. This is a moment of deep focus, where the material gains its plasticity, and my mind is already envisioning the shape it will soon become.",
      },
      {
        type: "photos",
        photos: [{ ...PHOTO.clayBall, alt: "A ball of raw clay on a wooden worktop" }],
      },
      { type: "heading", text: "2. Wheel Throwing" },
      {
        type: "paragraph",
        text: "To ensure the walls of the vessel have an even thickness, centering the clay is essential—meaning it must sit perfectly in the very middle of the wheel (learning to center is no easy feat and takes a beginner ceramicist a lot of time). Only then do my thumbs open up its core, and my fingers pull the walls upward, giving the formless mass its very first shape.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.throwingVase, alt: "Throwing a vase on the pottery wheel" },
          {
            ...PHOTO.throwingWalls,
            alt: "Clay-covered hands pulling up the walls of a pot on the wheel",
          },
        ],
      },
      { type: "heading", text: "3. Trimming" },
      {
        type: "paragraph",
        text: 'Once the piece dries to what we call "leather hard," it goes back onto the wheel. Using metal tools, I trim away the excess clay and shape the foot ring—this is where the real magic happens, as it takes on its final form. Next, it\'s time to attach handles to the mugs and move on to my absolute favorite part of the whole process: carving the clay. When the pot is ready, it has to dry very slowly to avoid cracking, which can take up to a few days.',
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.trimming, alt: "Trimming: a metal tool shaves excess clay off an upturned pot" },
          { ...PHOTO.trimmingFoot, alt: "Shaping the foot ring on the spinning wheel" },
          { ...PHOTO.carving, alt: "An upturned mug carved with a leaf pattern, next to a carving tool" },
          { ...PHOTO.drying, alt: "Unfired pots drying in the studio beside the tools" },
        ],
      },
      { type: "heading", text: "4. Bisque Firing" },
      {
        type: "paragraph",
        text: "The fragile, bone-dry vessels are placed into the kiln for their first firing at around 900–1000°C (1650–1830°F). After a dozen or so hours, the clay permanently changes its structure—transforming into hard, porous earthenware.",
      },
      { type: "heading", text: "5. The Alchemy of Glazing" },
      {
        type: "paragraph",
        text: "This is where the process of coating the clay with glazes takes place. It requires a massive amount of imagination, because unfired glazes are completely matte and often look entirely different from their post-firing colors. As I apply a gray liquid, I have to visualize the future ocean blue or forest green in my mind's eye—and even then, the final result surprises me deeply every single time.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.glazedMugs, alt: "Two glazed mugs, pink and white, before the second firing" },
          { ...PHOTO.glazedPots, alt: "Glazed cups waiting for the second firing" },
        ],
      },
      { type: "heading", text: "6. The Second Firing, or the Ultimate Magic" },
      {
        type: "paragraph",
        text: "The vessels return to the kiln for another firing, usually at temperatures above 1200°C (2190°F). In this intense heat, the glaze melts into a glossy, glassy surface, and the clay vitrifies into durable stoneware. Opening the kiln after a full day of cooling down is always a moment of pure magic.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.firedBlue, alt: "Three blue mugs after the second firing, held in two hands" },
          { ...PHOTO.firedStack, alt: "A stack of three finished mugs held in two hands" },
        ],
      },
      { type: "heading", text: "A Piece of My Everyday Life in Your Home" },
      {
        type: "paragraph",
        text: "Every thumbprint, gentle curve, or unique glaze drip is proof that these objects once lived in my hands. By creating at home, I pour a piece of my everyday life into each ceramic piece.",
      },
      {
        type: "paragraph",
        text: "I hope you find something here that brings you joy and adds warmth to your home.",
      },
      {
        type: "photos",
        photos: [
          {
            ...PHOTO.thankYou,
            alt: "A ceramic tealight holder with a lit candle beside a thank-you card and Magda Ceramics tags",
          },
        ],
      },
      { type: "heading", text: "Join Me on Instagram!" },
      {
        type: "paragraph",
        text: "If you'd like a peek into my daily studio routine, behind-the-scenes footage, and moments from the making process, come follow my profile: @magda_ceramics.",
      },
    ],
    signature: "See you there!\nMagda",
  },
  pl: {
    title: "Od surowej kulki gliny do gotowego naczynia – jak powstaje moja ceramika",
    blocks: [
      {
        type: "paragraph",
        text: "Każdy kubek, miska czy wazon, który trafia w Twoje ręce, to historia zapisana w glinie, dłoniach i ogniu. Cały proces toczy się w mojej domowej pracowni, gdzie codzienna przestrzeń życiowa miesza się z artystycznym rzemiosłem.",
      },
      {
        type: "photos",
        photos: [
          {
            ...PHOTO.kitchenStudio,
            alt: "Domowa pracownia Magdy w kuchni: koło garncarskie, stolik i narzędzia",
          },
        ],
      },
      {
        type: "paragraph",
        text: "Oto droga, jaką przechodzi każda rzecz, zanim trafi na Twój stół:",
      },
      { type: "heading", text: "1. Przygotowanie" },
      {
        type: "paragraph",
        text: "Wszystko zaczyna się od chłodnej i mokrej kulki gliny. Ważę ją i dokładnie wyrabiam, aby usunąć wszystkie pęcherzyki powietrza. To moment skupienia, w którym materiał zyskuje plastyczność, a ja jestem już myślami przy kształcie, który z niego powstanie.",
      },
      {
        type: "photos",
        photos: [{ ...PHOTO.clayBall, alt: "Kulka surowej gliny na drewnianym blacie" }],
      },
      { type: "heading", text: "2. Toczenie na kole" },
      {
        type: "paragraph",
        text: "Aby ścianki naczynia miały równą grubość, niezbędne jest wycentrowanie gliny, czyli ułożenie jej na samym środku koła (nauka centrowania nie jest łatwa i zajmuje początkującemu ceramikowi mnóstwo czasu). Dopiero wtedy kciuki otwierają jej wnętrze, a palce wyciągają ścianki w górę, nadając bezkształtnej bryle pierwszy kształt.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.throwingVase, alt: "Toczenie wazonu na kole garncarskim" },
          { ...PHOTO.throwingWalls, alt: "Dłonie w glinie wyciągają ścianki naczynia na kole" },
        ],
      },
      { type: "heading", text: "3. Trymowanie" },
      {
        type: "paragraph",
        text: "Gdy naczynie podeschnie do tzw. stanu skórzastej twardości (leather hard), wraca na koło. Metalowymi narzędziami odcinam nadmiar gliny i formuję stopkę – to tu dzieje się największa magia, bo naczynie przyjmuje swój ostateczny kształt. Teraz czas na doklejanie uszek do kubków oraz moje ulubione rzeźbienie w glinie (carving). Następnie naczynia wracają pod folię, gdzie niespiesznie schną – w zależności od temperatury otoczenia może to trwać nawet kilka dni.",
      },
      {
        type: "photos",
        photos: [
          {
            ...PHOTO.trimming,
            alt: "Trymowanie: metalowe narzędzie zdejmuje nadmiar gliny z odwróconego naczynia",
          },
          { ...PHOTO.trimmingFoot, alt: "Formowanie stopki na obracającym się kole" },
          {
            ...PHOTO.carving,
            alt: "Odwrócony kubek z wyrzeźbionym wzorem liści obok narzędzia do rzeźbienia",
          },
          { ...PHOTO.drying, alt: "Niewypalone naczynia schną w pracowni obok narzędzi" },
        ],
      },
      { type: "heading", text: "4. Wypał na biskwit" },
      {
        type: "paragraph",
        text: "Kruche, suche naczynia trafiają do pieca na pierwszy wypał w temperaturze ok. 900–1000°C. Po kilkunastu godzinach glina bezpowrotnie zmienia swoją strukturę – staje się twardą, porowatą ceramiką.",
      },
      { type: "heading", text: "5. Alchemia szkliwienia" },
      {
        type: "paragraph",
        text: "Tu następuje proces pokrywania gliny szkliwami. Trzeba się przy tym wykazać ogromną wyobraźnią, ponieważ niewypalone szkliwa są matowe i bardzo często mają zupełnie inne kolory niż po wypale. Nakładając szary płyn, muszę widzieć oczami wyobraźni przyszły błękit oceanu czy leśną zieleń – a i tak efekt końcowy za każdym razem mocno mnie zaskakuje.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.glazedMugs, alt: "Dwa kubki po szkliwieniu, różowy i biały, przed drugim wypałem" },
          { ...PHOTO.glazedPots, alt: "Kubki pokryte szkliwem czekają na drugi wypał" },
        ],
      },
      { type: "heading", text: "6. Drugi wypał, czyli ostateczna magia" },
      {
        type: "paragraph",
        text: "Naczynia wracają do pieca na kolejny wypał, zwykle w temperaturze powyżej 1200°C. W tych warunkach szkliwo topi się w szklaną powierzchnię, a glina spieka się na kamień. Otwieranie pieca po dobie stygnięcia to zawsze moment czystej magii.",
      },
      {
        type: "photos",
        photos: [
          { ...PHOTO.firedBlue, alt: "Trzy niebieskie kubki po drugim wypale, trzymane w dłoniach" },
          { ...PHOTO.firedStack, alt: "Stos trzech gotowych kubków w dłoniach" },
        ],
      },
      { type: "heading", text: "Kawałek mojej codzienności w Twoim domu" },
      {
        // ‼️ W dokumencie zdanie urywa się po „i dużo" — czeka na dokończenie
        // od Magdy. Do tego czasu stoi dokładnie tak jak w dokumencie.
        type: "paragraph",
        text: "Każdy ślad mojego kciuka, delikatna krzywizna czy niepowtarzalny zaciek szkliwa to dowód na to, że te przedmioty żyły w moich dłoniach. Tworząc w domu, oddaję ceramice kawałek swojej codzienności i dużo",
      },
      {
        // ‼️ W dokumencie brakuje tu słowa („co sprawi Ci Tobie") — czeka na
        // poprawkę od Magdy. Do tego czasu stoi dokładnie tak jak w dokumencie.
        type: "paragraph",
        text: "Mam nadzieję, że znajdziesz u mnie coś, co sprawi Ci Tobie oraz Twoim bliskim.",
      },
      {
        type: "photos",
        photos: [
          {
            ...PHOTO.thankYou,
            alt: "Ceramiczny świecznik z zapaloną świeczką obok kartki z podziękowaniem i metek Magda Ceramics",
          },
        ],
      },
      { type: "heading", text: "Dołącz do mnie na Instagramie!" },
      {
        type: "paragraph",
        text: "Jeśli chcesz podglądać moją codzienną pracę w pracowni, ujęcia zza kulis i momenty z etapów tworzenia, wpadnij na mój profil: @magda_ceramics.",
      },
    ],
    signature: "Do zobaczenia!\nMagda",
  },
};
