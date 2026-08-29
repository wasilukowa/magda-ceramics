import { Link } from "@/i18n/navigation";
import { LegalBlockType } from "@/contracts/shared";
import { LegalBlock, LegalDocument, LegalTextRun } from "@/content/types";
import { cn } from "@/lib/utils";

// Zamienia dane z content/legal na treść strony. Widok nie wie nic o tym, co
// stoi w regulaminie — zna tylko akapity, listy i trzy rodzaje wyróżnień.

function TextRun({ run }: { run: LegalTextRun }) {
  if (run.route) {
    return (
      <Link
        href={run.hash ? { pathname: run.route, hash: run.hash } : run.route}
        className="text-[var(--foreground)] underline"
      >
        {run.text}
      </Link>
    );
  }

  if (run.href) {
    return (
      <a href={run.href} className="text-[var(--foreground)] underline">
        {run.text}
      </a>
    );
  }

  if (run.strong) {
    return <strong className="text-[var(--foreground)]">{run.text}</strong>;
  }

  if (run.italic) {
    return <span className="italic">{run.text}</span>;
  }

  return <>{run.text}</>;
}

// Klucz z indeksu jest tu bezpieczny: dokumenty to stała treść, nic się w nich
// nie przestawia ani nie dopisuje w trakcie działania strony.
function Runs({ runs }: { runs: LegalTextRun[] }) {
  return (
    <>
      {runs.map((run, index) => (
        <TextRun key={index} run={run} />
      ))}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === LegalBlockType.List) {
    return (
      <ul className="list-disc list-inside space-y-1 pl-2">
        {block.items.map((item, index) => (
          <li key={index}>
            <Runs runs={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p>
      <Runs runs={block.content} />
    </p>
  );
}

// Nagłówek sekcji do użycia poza samym dokumentem — strona „Wysyłka i zwroty"
// wplata między sekcje tabelę stawek i ma wyglądać tak samo jak reszta.
export function LegalHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs tracking-widest uppercase text-[var(--foreground)] mb-4">
      {children}
    </h2>
  );
}

export default function LegalSections({ sections }: { sections: LegalDocument }) {
  return (
    <>
      {sections.map((section, index) => (
        <section
          key={section.id ?? index}
          id={section.id}
          // Przyklejony nagłówek ma 150 px na telefonie i 182 px od 768 px —
          // bez tego odstępu kotwica chowa sekcję pod paskiem.
          className={cn(section.id && "scroll-mt-40 md:scroll-mt-52")}
        >
          <LegalHeading>{section.heading}</LegalHeading>
          <div className="space-y-3">
            {section.blocks.map((block, blockIndex) => (
              <Block key={blockIndex} block={block} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
