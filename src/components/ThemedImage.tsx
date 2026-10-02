import Image from "next/image";
import { ThemedImageProps } from "@/contracts/shared";
import { cn } from "@/lib/utils";

// Dwie wersje tego samego obrazka, z których widać zawsze jedną: wybiera CSS
// (wariant `dark:`), więc właściwa jest od pierwszego malowania, także na
// stronie zbudowanej wcześniej na serwerze. Ukryta wersja ma display: none,
// więc czytnik ekranu nie przeczyta podpisu dwa razy.
export default function ThemedImage({
  src,
  darkSrc,
  className,
  alt,
  ...rest
}: ThemedImageProps) {
  return (
    <>
      <Image {...rest} src={src} alt={alt} className={cn(className, "dark:hidden")} />
      <Image {...rest} src={darkSrc} alt={alt} className={cn(className, "hidden dark:block")} />
    </>
  );
}
