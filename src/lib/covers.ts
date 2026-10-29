import type { StaticImageData } from "next/image";
import enit from "../../public/img/covers/enit.jpg";
import fmsSfax from "../../public/img/covers/fms-sfax.jpg";
import fmtTunis from "../../public/img/covers/fmt-tunis.jpg";
import isetMahdia from "../../public/img/covers/iset-mahdia.jpg";
import isticBorjCedria from "../../public/img/covers/istic-borj-cedria.jpg";
import isimaMahdia from "../../public/img/covers/isima-mahdia.jpg";
import mahdia from "../../public/img/covers/mahdia.jpg";
import manouba from "../../public/img/covers/universite-de-la-manouba.jpg";
import monastir from "../../public/img/covers/universite-de-monastir.jpg";
import sousse from "../../public/img/covers/universite-de-sousse.jpg";
import tunis from "../../public/img/covers/universite-de-tunis.jpg";
import zitouna from "../../public/img/covers/universite-ez-zitouna.jpg";
import elManar from "../../public/img/covers/universite-tunis-el-manar.jpg";

// Real photos: from Wikimedia Commons (credited as their licences require) or provided by the site owner.
export type Cover = {
  image: StaticImageData;
  /** What the photo shows, shown with the credit. */
  caption: string;
  /** Credit fields; omitted for photos provided directly by the site owner. */
  author?: string;
  license?: string;
  /** The Commons file page, which carries the full licence. */
  source?: string;
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(" ", "_"))}`;

const institutes: Record<string, Cover> = {
  // Provided by the site owner.
  "istic-borj-cedria": {
    image: isticBorjCedria,
    caption: "ISTIC Borj Cédria",
  },
  "fmt-tunis": {
    image: fmtTunis,
    caption: "Faculté de Médecine de Tunis",
    author: "Houssem Abida",
    license: "CC BY-SA 4.0",
    source: commons("Faculté de médecine de Tunis.jpg"),
  },
  enit: {
    image: enit,
    caption: "Entrée de l'ENIT",
    author: "Hamdiing1989",
    license: "CC BY-SA 4.0",
    source: commons("ENIT.jpg"),
  },
  "isima-mahdia": {
    image: isimaMahdia,
    caption: "Cour d'entrée de l'ISIMa",
    author: "Saladin hs",
    license: "CC BY-SA 4.0",
    source: commons("Panorama.ISIMa.jpg"),
  },
  "iset-mahdia": {
    image: isetMahdia,
    caption: "ISET Mahdia",
    author: "Sharon Hahn Darlin",
    license: "CC BY 2.0",
    source: commons("Hiboun, Mahdia Governorate, Tunisia Feb 2024 - Institut Supérieur de Études Technologiques de Mahdia.jpg"),
  },
  "fms-sfax": {
    image: fmsSfax,
    caption: "Entrée de la Faculté de Médecine de Sfax",
    author: "Csisc",
    license: "CC BY-SA 4.0",
    source: commons("Faculty of Medicine of Sfax - Gate.jpg"),
  },
};

// For institutes without their own photo, a picture of their city says more than a stranger's building.
const cities: Record<string, Cover> = {
  Mahdia: {
    image: mahdia,
    caption: "Mahdia, vue d'en haut",
    author: "Yassine fessili",
    license: "CC0",
    source: commons("Mahdia8378.jpg"),
  },
};

const universities: Record<string, Cover> = {
  "universite-de-monastir": {
    image: monastir,
    caption: "Université de Monastir",
    author: "Jihed M'hamed",
    license: "CC BY-SA 4.0",
    source: commons("Université de Monastir 1.jpg"),
  },
  "universite-de-sousse": {
    image: sousse,
    caption: "Université de Sousse",
    author: "Rais67",
    license: "Domaine public",
    source: commons("Tunisie Université de Sousse.jpg"),
  },
  "universite-de-tunis": {
    image: tunis,
    caption: "Université de Tunis, avenue du 9 Avril",
    author: "Rais67",
    license: "Domaine public",
    source: commons("Tunis Université de Tunis.JPG"),
  },
  "universite-tunis-el-manar": {
    image: elManar,
    caption: "Campus de l'Université de Tunis El Manar",
    author: "Michael Sean Gallagher",
    license: "CC BY-SA 2.0",
    source: commons("Tunis El-Manar University.jpg"),
  },
  "universite-de-la-manouba": {
    image: manouba,
    caption: "Campus universitaire de la Manouba",
    author: "Jorge Franganillo",
    license: "CC BY 3.0",
    source: commons("Campus universitaire de la Manouba - panoramio.jpg"),
  },
  "universite-ez-zitouna": {
    image: zitouna,
    caption: "Université Ez-Zitouna",
    author: "Rais67",
    license: "Domaine public",
    source: commons("Tunis Faculté Zaitouna.JPG"),
  },
};

/** The institute's own photo, else its city's, else its university's; null when none is known. */
export function coverFor(inst: { slug: string; city: string | null; universitySlug: string }): Cover | null {
  return (
    institutes[inst.slug] ??
    (inst.city && cities[inst.city]) ??
    universities[inst.universitySlug] ??
    null
  );
}
