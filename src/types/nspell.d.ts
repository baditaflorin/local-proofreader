declare module "nspell" {
  interface Dictionary {
    aff: string;
    dic: string;
  }

  interface SpellChecker {
    correct(word: string): boolean;
    suggest(word: string): string[];
    add(word: string): void;
  }

  export default function nspell(dictionary: Dictionary): SpellChecker;
}
