// Pamięć przeglądarki jako zewnętrzne źródło stanu dla useSyncExternalStore.
//
// Wcześniej providery czytały localStorage w useEffect i wołały setState, co
// React 19 zgłasza jako kaskadę renderów. Tutaj localStorage JEST źródłem
// prawdy: komponent subskrybuje wartość, a zapis od razu powiadamia
// subskrybentów. Przy okazji znika okno, w którym efekt zapisujący nadpisywał
// pamięć pustą wartością, zanim efekt czytający zdążył ją wczytać, a zmiana w
// jednej karcie dociera do pozostałych.
export type LocalStorageStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  read: () => T;
  write: (value: T) => void;
  clear: () => void;
};

export function createLocalStorageStore<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T,
  // Domyślnie JSON, ale waluta siedzi w pamięci jako goły tekst („pln") i
  // owinięcie jej w cudzysłowy zerwałoby zgodność z tym, co już zapisane.
  serialize: (value: T) => string = JSON.stringify
): LocalStorageStore<T> {
  const listeners = new Set<() => void>();

  // useSyncExternalStore porównuje migawki referencją, więc ta sama zawartość
  // musi zwracać ten sam obiekt — inaczej React renderuje w kółko.
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  const emit = () => listeners.forEach((listener) => listener());

  const read = (): T => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      return fallback;
    }

    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw === null ? fallback : parse(raw);
      } catch {
        cachedValue = fallback;
      }
    }

    return cachedValue;
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      // Zmiana w innej karcie tej samej witryny.
      window.addEventListener("storage", listener);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    read,
    write(value) {
      const raw = serialize(value);
      try {
        localStorage.setItem(key, raw);
      } catch {
        // Prywatne okno albo pełna pamięć — stan zostaje w tej sesji.
      }
      cachedRaw = raw;
      cachedValue = value;
      emit();
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {}
      cachedRaw = null;
      cachedValue = fallback;
      emit();
    },
  };
}
