import Image from "next/image";
import { getTranslations } from "next-intl/server";

const photos = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  src: `/o-mnie/magda-o-mnie-${n}.jpg`,
  alt: `Magda ceramics ${n}`,
}));

export async function generateMetadata() {
  const t = await getTranslations("footer");
  return { title: `${t("aboutTitle")} — Magda Ceramics` };
}

function AboutEN() {
  return (
    <div className="prose prose-sm max-w-none text-[var(--muted)] leading-relaxed space-y-5">
      <p>
        Hello! I&apos;m so glad you&apos;re here :)
      </p>
      <p>
        My name is Magda, and I&apos;d like to welcome you to my creative – and usually very dusty –
        world. I live in Warsaw, Poland, with my husband Tomasz and our teenage son Kuba.
      </p>
      <p>
        In a world full of constant noise and a fast-paced lifestyle, working with clay is what keeps
        me grounded. I simply love the entire process of creation, whether I&apos;m shaping a large
        vase or molding a tiny, cute mini pot.
      </p>
      <p>
        My journey with clay began in late 2023 when I was searching for an engaging hobby, and I got
        hooked instantly. In 2026, I set up a tiny, cozy pottery studio right in the corner of my
        kitchen. This is where the magic happens: spinning the pottery wheel, experimenting with
        different types of clay, and letting my imagination run wild. I am absolutely in love with
        carving and painting ceramics, which is why no two pieces of mine are ever alike.
      </p>
      <p>
        I hope you enjoy spending time here and find something truly unique for yourself or your
        loved ones.
      </p>
      <p>Thank you for being a part of my journey.</p>
      <p className="font-medium text-[var(--foreground)]">Magda</p>
    </div>
  );
}

function AboutPL() {
  return (
    <div className="prose prose-sm max-w-none text-[var(--muted)] leading-relaxed space-y-5">
      <p>Cześć! Bardzo się cieszę, że tu trafiliście :)</p>
      <p>
        Nazywam się Magda i witam Was w moim pełnym pasji, twórczego nieładu i – nie ukrywajmy –
        wszechobecnego pyłu świecie. Na co dzień mieszkam w Warszawie razem z mężem Tomaszem i
        naszym nastoletnim synem Kubą.
      </p>
      <p>
        Gdy wokół panuje szum, a życie pędzi jak szalone, glina staje się moją bezpieczną przystanią.
        To ona daje mi wewnętrzny spokój.
      </p>
      <p>
        Moja ceramiczna ścieżka rozpoczęła się pod koniec 2023 roku, kiedy szukałam zajęcia dla rąk
        i głowy, a znalazłam miłość od pierwszego dotknięcia. W 2026 roku udało mi się wyczarować
        mini-pracownię w rogu własnej kuchni. To tu, przy szumie koła garncarskiego i eksperymentach
        z fakturami, uwalniam wyobraźnię. Ponieważ każde naczynie rzeźbię i maluję ręcznie, nie
        znajdziecie u mnie dwóch identycznych rzeczy.
      </p>
      <p>
        Rozgośćcie się i mam nadzieję, że odkryjecie tu coś unikalnego dla siebie lub bliskich.
      </p>
      <p>Dziękuję, że towarzyszycie mi w tej pięknej przygodzie.</p>
      <p className="font-medium text-[var(--foreground)]">Magda</p>
    </div>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("footer");

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-xs tracking-[0.3em] uppercase text-[var(--muted)] mb-12 text-center">
        {t("aboutTitle")}
      </h1>
      {locale === "pl" ? <AboutPL /> : <AboutEN />}
      <div className="mt-16 flex flex-col gap-6">
        {photos.map((photo) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={800}
            height={600}
            className="w-full object-cover rounded-sm"
          />
        ))}
      </div>
    </div>
  );
}
