import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    theme_color: "#000000",
  background_color: "#ffffff",
  icons: [
    {
      purpose: "maskable",
      sizes: "512x512",
      src: "icon512_maskable.png",
      type: "image/png"
    },
    {
      purpose: "any",
      sizes: "512x512",
      src: "icon512_rounded.png",
      type: "image/png"
    }
  ],
  orientation: "portrait",
  display: "standalone",
  dir: "auto",
  lang: "es-ES",
  start_url: "https://fit-balance-eight.vercel.app/dashboard",
  name: "FitBalance",
  short_name: "FitBalance"
  };
}
