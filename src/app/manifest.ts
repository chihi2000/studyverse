import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Studyverse",
    short_name: "Studyverse",
    description: "Actualités, emplois du temps, examens et ressources pour les étudiants en Tunisie.",
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#193d35",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
