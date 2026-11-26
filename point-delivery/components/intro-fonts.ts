export const INTRO_FONTS = {
  anton: { label: "Anton", src: "/fonts/anton/anton-regular.ttf" },
  "bebas-neue": { label: "Bebas Neue", src: "/fonts/bebas-neue/bebas-neue-regular.ttf" },
  "archivo-black": { label: "Archivo Black", src: "/fonts/archivo-black/archivo-black-regular.ttf" },
  bungee: { label: "Bungee", src: "/fonts/bungee/bungee-regular.ttf" },
} as const;

export type IntroFont = keyof typeof INTRO_FONTS;

export function isIntroFont(value: string): value is IntroFont {
  return Object.prototype.hasOwnProperty.call(INTRO_FONTS, value);
}
