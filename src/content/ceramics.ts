import { CeramicsByLocale } from "./types";

// ‼️ TEKST ROBOCZY — DO NAPISANIA PRZEZ MAGDĘ ‼️
//
// Kroki poniżej są prawdziwe i w dobrej kolejności, ale zdania przy nich to
// tylko rusztowanie: mówią, o czym w danym kroku napisać. Magda nadpisuje je
// swoimi słowami, po jednym akapicie na krok, i ustawia CERAMICS_DRAFT na
// false. Dopóki flaga jest true, na stronie widnieje uprzejma notka, że tekst
// jest w przygotowaniu — dzięki temu nie da się o tym zapomnieć i wypuścić
// cudzych słów jako swoich.
export const CERAMICS_DRAFT = true;

export const CERAMICS: CeramicsByLocale = {
  pl: {
    intro:
      "Każde naczynie, które u mnie znajdziecie, przechodzi przez te same siedem etapów. Między pierwszym a ostatnim mija zwykle kilka tygodni — glina nie lubi pośpiechu.",
    steps: [
      {
        heading: "Glina",
        paragraphs: [
          "Tu opowiem, z jakich glin pracuję i dlaczego akurat z nich — czym różni się kamionka od porcelany w dotyku i w gotowym naczyniu.",
        ],
      },
      {
        heading: "Toczenie na kole",
        paragraphs: [
          "Tu o samym toczeniu: ile trwa jedno naczynie, dlaczego dwa wyciągnięte tego samego dnia nigdy nie wychodzą identyczne i co się dzieje, gdy ręka drgnie.",
        ],
      },
      {
        heading: "Suszenie i toczenie stopki",
        paragraphs: [
          "Tu o czekaniu: dlaczego naczynie musi podeschnąć do stanu skórzastego, zanim wróci na koło, i jak powstaje stopka, na której potem stoi.",
        ],
      },
      {
        heading: "Rzeźbienie i malowanie",
        paragraphs: [
          "Tu o tym, co lubię najbardziej — o rzeźbieniu w podeschniętej glinie i o tym, skąd biorą się wzory. To ten etap sprawia, że nie ma u mnie dwóch takich samych rzeczy.",
        ],
      },
      {
        heading: "Pierwszy wypał — biskwit",
        paragraphs: [
          "Tu o pierwszym wypale: w jakiej temperaturze, ile godzin, i co znaczy, że z pieca wychodzi naczynie porowate, które dopiero czeka na szkliwo.",
        ],
      },
      {
        heading: "Szkliwienie",
        paragraphs: [
          "Tu o szkliwach: które są moje ulubione, dlaczego kolor przed wypałem nie ma nic wspólnego z kolorem po wypale i czemu ta niepewność jest najlepszą częścią pracy.",
        ],
      },
      {
        heading: "Drugi wypał",
        paragraphs: [
          "Tu o ostatnim wypale i o otwieraniu pieca następnego dnia. O tym, że czasem coś pęknie, i o tym, że czasem wychodzi coś lepszego, niż zaplanowałam.",
        ],
      },
    ],
    closing:
      "Dlatego każda praca jest jedna. Jeśli coś Wam się spodoba, to naprawdę nie ma drugiego takiego egzemplarza.",
  },
  en: {
    intro:
      "Every piece you will find here goes through the same seven stages. Weeks usually pass between the first and the last — clay does not like being hurried.",
    steps: [
      {
        heading: "The clay",
        paragraphs: [
          "Here I will write about the clays I work with and why those ones — how stoneware differs from porcelain, in the hand and in the finished piece.",
        ],
      },
      {
        heading: "On the wheel",
        paragraphs: [
          "Here about throwing itself: how long one piece takes, why two pulled on the same day never come out identical, and what happens when a hand wavers.",
        ],
      },
      {
        heading: "Drying and trimming the foot",
        paragraphs: [
          "Here about waiting: why a piece has to dry to leather-hard before it goes back on the wheel, and how the foot it later stands on is made.",
        ],
      },
      {
        heading: "Carving and painting",
        paragraphs: [
          "Here about the part I love most — carving into half-dry clay, and where the patterns come from. This is the stage that makes sure no two of my pieces are alike.",
        ],
      },
      {
        heading: "The first firing — bisque",
        paragraphs: [
          "Here about the first firing: what temperature, how many hours, and what it means that a porous piece comes out of the kiln still waiting for its glaze.",
        ],
      },
      {
        heading: "Glazing",
        paragraphs: [
          "Here about glazes: which are my favourites, why the colour before firing has nothing to do with the colour after, and why that uncertainty is the best part of the work.",
        ],
      },
      {
        heading: "The second firing",
        paragraphs: [
          "Here about the last firing, and about opening the kiln the next morning. About the ones that crack, and the ones that come out better than I planned.",
        ],
      },
    ],
    closing:
      "That is why every piece is one of one. If something catches your eye, there really is no second copy of it.",
  },
};
