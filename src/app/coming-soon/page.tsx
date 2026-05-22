import Image from "next/image";

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-4 h-4 flex-shrink-0"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TextContent() {
  return (
    <>
      <Image
        src="/logo.svg"
        alt="Magda Ceramics"
        width={360}
        height={140}
        className="mb-10 w-64 sm:w-80 min-[1100px]:w-96 h-auto"
      />

      <p className="text-sm min-[1100px]:text-base tracking-[0.3em] uppercase text-[#1a1a1a] mb-4">
        Currently in the kiln
      </p>
      <p className="text-sm min-[1100px]:text-base tracking-[0.3em] uppercase text-[#1a1a1a] mb-12">
        Shop coming soon
      </p>

      <p className="text-sm min-[1100px]:text-base text-[#1a1a1a] mb-2">
        Join me on my instagram:
      </p>
      <a
        href="https://www.instagram.com/magda_ceramics"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm min-[1100px]:text-base text-[#1a1a1a] underline underline-offset-4 hover:opacity-60 transition-opacity"
      >
        <InstagramIcon />
        magda_ceramics
      </a>
    </>
  );
}

export default function ComingSoon() {
  return (
    <section className="fixed inset-0 z-[9999] overflow-hidden">

      {/* Mobile / tablet (< 1100px): pełnoekranowe zdjęcie z nakładką tekstową */}
      <div className="min-[1100px]:hidden relative w-full h-full">
        <div className="absolute inset-0 p-[20px] bg-[#8AAAA6]">
          <div className="relative w-full h-full">
            <Image
              src="/coming-soon.jpg"
              alt="Handmade ceramics"
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>

        {/* Nakładka tekstowa — wyśrodkowana na zdjęciu */}
        <div className="absolute inset-[20px] flex items-center justify-center">
          <div className="w-full bg-white/70 flex flex-col items-center px-8 py-8 text-center">
            <TextContent />
          </div>
        </div>
      </div>

      {/* Desktop (≥ 1100px): dwie kolumny */}
      <div className="hidden min-[1100px]:grid min-[1100px]:grid-cols-2 h-full">
        <div className="relative p-[20px] bg-[#8AAAA6]">
          <div className="relative w-full h-full">
            <Image
              src="/coming-soon.jpg"
              alt="Handmade ceramics"
              fill
              sizes="50vw"
              className="object-cover object-center"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#8AAAA6] px-10 py-10 text-center">
          <TextContent />
        </div>
      </div>

    </section>
  );
}
