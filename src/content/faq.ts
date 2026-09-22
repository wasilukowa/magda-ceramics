import { FaqByLocale } from "./types";

// Pytania, które wracają najczęściej.
//
// ‼️ MAGDA: TO JEST TWÓJ DOKUMENT FAQ, przepisany co do słowa i w Twojej
// kolejności — te same trzy sekcje, te same pytania, te same odpowiedzi.
// Poprawione tylko dwie literówki: „z żywności" → „z żywnością" i brakująca
// spacja w nagłówku „Zamówienia, wysyłka, zwroty". Nic tu nie dopisywałyśmy:
// co jest w pliku, to jest na stronie, i odwrotnie.
//
// Budowa jest prosta: `question` to pytanie, `answer` to odpowiedź (każdy
// wpis w cudzysłowie = jeden akapit), `moreRoute` dokłada pod odpowiedzią
// odnośnik „Czytaj więcej" do strony „Wysyłka i zwroty".
//
// Wersja angielska to tłumaczenie tych samych pytań — gdy zmienisz polskie,
// trzeba zmienić i angielskie, inaczej obie wersje się rozjadą.
export const FAQ: FaqByLocale = {
  pl: [
    {
      heading: "Proces Tworzenia i Unikalność",
      entries: [
        {
          question: "W jaki sposób powstaje Twoja ceramika?",
          answer: [
            "Wszystkie kubki, miski i wazony toczę własnoręcznie na kole garncarskim. Każdy przedmiot przechodzi przez moje dłonie wielokrotnie: od przygotowania gliny, przez toczenie, trymowanie (nadawanie ostatecznego kształtu i stopki), doklejanie uszek, aż po dwukrotny wypał w piecu ceramicznym w temperaturze ponad 1200°C oraz ręczne szkliwienie.",
          ],
        },
        {
          question: "Czy naczynia są idealnie równe?",
          answer: [
            "Praca na kole pozwala na uzyskanie pięknych, regularnych kształtów, jednak nie jest to produkcja fabryczna. Na naczyniach możesz czasami wyczuć delikatne ślady moich palców (tzw. ślady toczenia) lub zauważyć minimalne różnice w wielkości (w granicach kilku milimetrów) między dwoma z pozoru takimi samymi kubkami. To dowód na to, że kupujesz autentyczne rękodzieło, a nie odlew z formy. Takie naczynia mają duszę.",
          ],
        },
      ],
    },
    {
      heading: "Użytkowanie i Bezpieczeństwo",
      entries: [
        {
          question: "Czy mogę myć ceramikę w zmywarce i używać jej w mikrofalówce?",
          answer: [
            "Tak. Ceramika toczona na kole i wypalana w wysokich temperaturach (kamionka) jest bardzo trwała. Wszystkie naczynia możesz bezpiecznie myć w zmywarce i podgrzewać w mikrofalówce.",
          ],
        },
        {
          question: "Czy naczynia są bezpieczne w kontakcie z żywnością?",
          answer: [
            "Absolutnie tak. Używam wyłącznie profesjonalnych, bezołowiowych szkliw, które posiadają atesty bezpieczeństwa i są w 100% przeznaczone do kontaktu z żywnością.",
          ],
        },
        {
          question: "Dlaczego wnętrze mojego kubka zafarbowało od kawy/herbaty?",
          answer: [
            "Niektóre jasne lub matowe szkliwa mogą z czasem przyjmować osad z ciemnych napojów. Jest to całkowicie naturalny proces. Aby pozbyć się osadu, wystarczy przetrzeć wnętrze naczynia gąbką z odrobiną sody oczyszczonej lub soku z cytryny.",
          ],
        },
        {
          question: "Czy miski nadają się do gorących zup i dań z piekarnika?",
          answer: [
            "Moje miski świetnie sprawdzają się do gorących zup, ramenu czy owsianek. Pamiętaj jednak, że ceramika nie lubi szoku termicznego. Nie wkładaj zimnej miski (np. prosto z lodówki) do nagrzanego piekarnika i nie zalewaj rozgrzanego naczynia lodowatą wodą, bo może pęknąć.",
          ],
        },
        {
          question: "Jak dbać o wazony i ceramikę matową?",
          answer: [
            "Wazony po użyciu wystarczy przepłukać ciepłą wodą z płynem do naczyń. Jeśli produkt ma matowe wykończenie z zewnątrz, unikaj szorowania go ostrymi zmywakami, aby nie porysować powierzchni.",
          ],
        },
      ],
    },
    {
      heading: "Zamówienia, wysyłka, zwroty",
      entries: [
        {
          question: "Czy mogę zamówić u Ciebie ceramikę?",
          answer: [
            "Niestety nie realizuję zamówień indywidualnych, możesz kupić tylko to, co widnieje na stronie.",
          ],
        },
        {
          question: "Czy pakujesz paczki w duchu Less Waste?",
          answer: [
            "Tak, ochrona środowiska jest dla mnie ważna. Do zabezpieczenia ceramiki używam papieru nacinanego (zamiennik folii bąbelkowej), kartonowych pudełek oraz biodegradowalnego wypełniacza (skropaka), który rozpuszcza się w wodzie lub można go wrzucić do kompostownika.",
          ],
        },
        {
          question: "Co zrobić, jeśli ceramika potłucze się w transporcie?",
          answer: [
            "Pakowanie toczonej ceramiki traktuję bardzo poważnie i solidnie ją zabezpieczam. Jeśli jednak paczka ucierpi podczas dostawy, zrób zdjęcie uszkodzonego przedmiotu w dniu odebrania i napisz do mnie. Wyślę nowy produkt lub zwrócę Ci pieniądze.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
        {
          question: "Czy wysyłasz paczki do Paczkomatów InPost?",
          answer: [
            "Tak, podczas finalizacji zamówienia możesz wybrać dostawę do wygodnego dla Ciebie Paczkomatu InPost lub kuriera bezpośrednio pod wskazany adres.",
          ],
          moreRoute: "/shipping",
        },
        {
          question: "Czy mogę zwrócić zakupiony produkt?",
          answer: [
            "Tak. Masz prawo do zwrotu gotowego produktu w ciągu 14 dni od otrzymania paczki bez podania przyczyny. Pamiętaj jednak, że produkty personalizowane i robione na specjalne zamówienie nie podlegają zwrotom.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
      ],
    },
  ],
  en: [
    {
      heading: "How the pieces are made",
      entries: [
        {
          question: "How is your ceramic made?",
          answer: [
            "Every mug, bowl and vase is thrown by my own hands on the potter's wheel. Each piece passes through those hands many times over: preparing the clay, throwing, trimming (giving it its final shape and its foot), attaching the handles, then two firings in the kiln at over 1200°C and glazing by hand.",
          ],
        },
        {
          question: "Are the pieces perfectly even?",
          answer: [
            "Throwing on the wheel gives beautiful, regular shapes, but this is not factory production. Here and there you may feel the faint marks of my fingers (throwing lines) or notice a tiny difference in size — a few millimetres — between two seemingly identical mugs. That is your proof that you are buying genuine handmade work and not a cast from a mould. Pieces like these have a soul.",
          ],
        },
      ],
    },
    {
      heading: "Use and safety",
      entries: [
        {
          question: "Can I put the ceramics in the dishwasher and the microwave?",
          answer: [
            "Yes. Thrown on the wheel and fired at high temperatures (stoneware), the ceramics are very durable. Every piece is safe in the dishwasher and can be warmed in the microwave.",
          ],
        },
        {
          question: "Are the pieces safe to eat and drink from?",
          answer: [
            "Absolutely. I use nothing but professional, lead-free glazes that carry safety certificates and are 100% intended for contact with food.",
          ],
        },
        {
          question: "Why has the inside of my mug stained from coffee or tea?",
          answer: [
            "Some pale or matte glazes take on a deposit from dark drinks over time. It is an entirely natural process. To get rid of it, wipe the inside of the piece with a sponge and a little baking soda or lemon juice.",
          ],
        },
        {
          question: "Are the bowls suitable for hot soup and for the oven?",
          answer: [
            "My bowls are wonderful for hot soup, ramen or porridge. Do remember, though, that ceramics dislike thermal shock. Don't put a cold bowl (straight from the fridge, say) into a hot oven, and don't pour ice-cold water into a piece that is hot — it may crack.",
          ],
        },
        {
          question: "How should I care for vases and matte ceramics?",
          answer: [
            "After use, a vase only needs rinsing in warm water with washing-up liquid. If a piece is matte on the outside, avoid scouring it with a rough sponge so that the surface does not get scratched.",
          ],
        },
      ],
    },
    {
      heading: "Orders, shipping, returns",
      entries: [
        {
          question: "Can I order a piece of ceramics from you?",
          answer: [
            "I am afraid I do not take individual orders — you can only buy what is on the site.",
          ],
        },
        {
          question: "Do you pack parcels in the spirit of Less Waste?",
          answer: [
            "Yes, looking after the environment matters to me. I protect the ceramics with slit paper (in place of bubble wrap), cardboard boxes and a biodegradable filler (starch chips) that dissolves in water or can go straight onto the compost heap.",
          ],
        },
        {
          question: "What should I do if a piece breaks in transit?",
          answer: [
            "I take the packing of thrown ceramics very seriously and protect every piece well. If the parcel does suffer on its way to you, photograph the damaged piece on the day it arrives and write to me. I will send a new piece or refund your money.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
        {
          question: "Do you send parcels to InPost lockers?",
          answer: [
            "Yes — as you finish your order you can choose delivery to whichever InPost locker suits you, or a courier straight to the address you give.",
          ],
          moreRoute: "/shipping",
        },
        {
          question: "Can I return a piece I have bought?",
          answer: [
            "Yes. You have the right to return a ready-made piece within 14 days of receiving the parcel, without giving a reason. Do remember, though, that personalised pieces and those made to a special order cannot be returned.",
          ],
          moreRoute: "/shipping",
          moreHash: "returns",
        },
      ],
    },
  ],
};
