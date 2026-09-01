import { Review } from "./types";

// Opinie kupujących z profilu Magdy na Vinted, pobrane 1 września 2026.
// Treści są PRZEPISANE DOSŁOWNIE, w oryginalnym języku i z oryginalną
// interpunkcją — to cudze słowa, nie nasz tekst marketingowy. Nie poprawiamy
// literówek, nie skracamy, nie tłumaczymy. Podpis to nick, pod którym opinia
// widnieje publicznie na Vinted.
// Profil miał wtedy 51 opinii: 39 od kupujących (wszystkie poniżej) i 12
// automatycznych komentarzy Vinted („Automatyczny komentarz: udana
// transakcja!"), które nie są niczyją wypowiedzią, więc ich nie przenosimy.
// ŚWIADOMIE POMINIĘTA jest jedna opinia — „Boty moc hezké! Doporučuji" od
// lenkajirov — bo dotyczy butów, nie ceramiki; na stronie pracowni
// wprowadzałaby w błąd.
export const REVIEWS_SOURCE_URL =
  "https://www.vinted.pl/member/227705523?tab=feedback";

// `featured` oznacza dziesiątkę pokazywaną w sliderach (strona główna i „O mnie").
// Osobna strona „Opinie" pokazuje wszystkie. Wybór jest redakcyjny: opinie, które
// mówią coś konkretnego o pracach albo o pakowaniu, w miarę różne produkty
// (kubki, świecznik, szkatułka) i jedna po angielsku. Żeby zmienić skład, wystarczy
// przestawić `featured` — nie trzeba ruszać kodu.
export const REVIEWS: Review[] = [
  { author: "deian05", rating: 5, text: "Super. Recomand!" },
  { author: "deian05", rating: 5, text: "Recomand cu încredere. Produse unicate și de calitate" },
  { author: "deian05", rating: 5, text: "Great! I recommend 😉" },
  { author: "magdalena_055", rating: 5, featured: true, text: "Jak zawsze wszystko piękne, zapakowane w taki sposób, że nie ma szans, żeby coś się rozbiło. Jakość wykonania: na 6!" },
  { author: "deian05", rating: 5, text: "Very nice products. I recommend!" },
  { author: "ubraniavintage", rating: 5, text: "Kubeczek prześliczny, bardzo szybka wysyłka. Polecam ☺️" },
  { author: "henedelde", rating: 5, text: "krásný hrnek, děkuji" },
  { author: "lasiczkab", rating: 5, featured: true, text: "Wspaniale ❣️. Profesjonalnie i bardzo przychylnie. Kubeczek cudowny 😀. Serdecznie Wszystkim polecam. Ja na pewno będę wracała 🌹" },
  { author: "karolk343", rating: 5, featured: true, text: "Ceramika piękna, staranie i bezpiecznie zapakowana. Dodatkowe upominki jak najbardziej w punkt (w zestawie z kagankami przyszły nawet świeczki z wosku pszczelego). Serdecznie polecam Panią Magdę i jej prace!" },
  { author: "cookiemonster8", rating: 5, text: "Piękny wazon, super zapakowany. Gorąco polecam:)!" },
  { author: "linchi", rating: 5, featured: true, text: "Polecam z całego serca! Piękna artystyczna ceramika wykonana bardzo starannie. Pięknie opakowana - polecam na prezent." },
  { author: "kokosia87", rating: 5, featured: true, text: "Jak najbardziej polecam! Kubeczki są wspaniałe i kawa cudownie z nich smakuje ☺️ na dodatek szybka wysyłka i przemiły kontakt ze sprzedającą -artystką 😉♥️" },
  { author: "martynaborczyk", rating: 5, text: "Super zabezpieczona przesyłka, bardzo polecam i dziękuję za gratis 🩷🩷" },
  { author: "emma_p002", rating: 5, featured: true, text: "Piece of art made by hands😍 the seller is so kind and all my support is going to magda_ceramics, thank you so much!" },
  { author: "marlenkazm", rating: 5, text: "Piękny 😍 ,wszystko super dziękuję bardzo" },
  { author: "kasia_kasko", rating: 5, text: "Przepiękne rzeczy, szybka wysyłka. Polecam 😊" },
  { author: "lenmaio", rating: 5, text: "Jättefina ljushållare och så fint inslagna i små paket med ljus och ett paket tändstickor!" },
  { author: "helenabeblocinska", rating: 5, text: "błyskawiczna wysyłka, ogromna troska o dobre zabezpieczenie wysyłanego produktu, no i oczywiście przepiękna ceramika, polecam!" },
  { author: "zofia646", rating: 5, text: "Zakup bardzo dobrze zapakowany. Dziękuję za dodatkowe akcesoria jak lampki i zapałki. Podobają mi się kaganki bardzo. Pozdrawiam serdecznie. Zofia" },
  { author: "ana010575", rating: 5, text: "Polecam z całego❤️" },
  { author: "annuszka_mf", rating: 5, text: "Wszystko fantastycznie 🤩 Przepiękna ceramika, fantastycznie zapakowana ! Błyskawiczna wysyłka. To już moje kolejne zamówienie. Polecam serdecznie 😊" },
  { author: "lasiczkab", rating: 5, text: "Kolejny cudowny zakup 😊. Przepiękny i oryginalny świecznik oraz miłe dodatki. Paczuszka wspaniale zabezpieczona. Bardzo dziękuję ❣️i Wszystkim serdecznie 💙 polecam." },
  { author: "gucef", rating: 5, featured: true, text: "Szkatułka przepiękna😍. Naprawdę cudna. Przesyłka super zapakowana i zabezpieczona. Dziękuje bardzo również za urocze gratisiki magnesiki. Pozdrawiam serdecznie" },
  { author: "annuszka_mf", rating: 5, featured: true, text: "Wszystko rewelacyjnie !!! Zapakowane fantastycznie, jak najpiękniejszy prezent 🤩 Świecznik z duszą ❤️ Polecam serdecznie !" },
  { author: "simtasmetu", rating: 5, text: "Tobula ir labai gražu 🥰🥰🥰🥰. Siuntinys supakuotas labai profesionaliai ir saugiai ⭐️⭐️⭐️⭐️⭐️" },
  { author: "magda.lena.22", rating: 5, text: "Bardzo szybka wysyłka, przepięknie zapakowana z uroczym liścikiem, ogromnie polecam <3 i oczywiście sam produkt jest śliczny" },
  { author: "zoskaw1", rating: 5, text: "pięknie wykonane rzeczy, dziękuję bardzo!" },
  { author: "zelka84", rating: 5, text: "Kubeczek jest PRZEPIĘKNY! Bardzo dobrze i bezpiecznie zapakowany. Gorąco polecam!" },
  { author: "williamdyer", rating: 5, text: "Ekspresowa wysyłka i wzorowe pakowanie. Szkatułka urocza. Serdecznie dziękuję i pozdrawiam! 🙂" },
  { author: "kalinka78910", rating: 5, featured: true, text: "Świateczny kubek z pierniczkiem i ceramiczne gwiazdki są przepiękne! Absolutnie unikatowe i zachwycające. Dotarły do mnie zapakowane dokładnie i z wielką troska. W każdym milimetrze szkliwa widać cierpliwa pracę rąk, ogromny talent, uwaznosc i serce twórczyni. Polecam mocno!" },
  { author: "cypek92", rating: 5, text: "Szybka wysyłka i dobry kontakt ze sprzedającym. Polecam 🙂👍" },
  { author: "lasiczkab", rating: 5, text: "Wspaniale i profesjonalnie 😊. Kubeczek śliczny a paczuszka bardzo starannie zabezpieczona. Dziękuję również za miłe słowa i pozdrawiam 🌹" },
  { author: "2023wal", rating: 5, text: "Kolejny mój zakup i ponowna radość. Kubki wyjątkowej urody a jednocześnie bardzo praktyczne w używaniu. Uchwyty kubków idealnie pasują do dłoni. Picie z nich to wielka przyjemność. Błyskawiczna dostawa, staranność w pakowaniu, miły prezencik oraz autorski liścik do mnie = odbiorca zakupu w raju. Ponownie dziękuję i polecam sprzedawcę i jego wyroby!" },
  { author: "burzae", rating: 5, text: "bardzo miły kontakt, błyskawiczna wysyłka no i śliczny kubeczek i gratisy w paczce, polecam serdecznie 👍❤️" },
  { author: "2023wal", rating: 5, featured: true, text: "Wszystko na najwyższym poziomie - przepiękne kubki, błyskawiczna dostawa, staranne i bezpieczne pakowanie oraz bardzo miły dodatek - niespodzianka. Polecam sprzedawcę!" },
  { author: "bjepsen", rating: 5, text: "Thank you so much for this lovely mug 🩵. It has been a pleasure dealing with you!" },
  { author: "laura33660", rating: 5, text: "Všetko super, rýchle dodanie, odporúčam 😇" },
  { author: "shoppoman", rating: 5, text: "Virkelig skøn handel - god kommunikation og hurtig levering 🙏🏻" },
];
