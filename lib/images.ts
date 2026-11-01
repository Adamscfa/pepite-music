// Les images Deezer (pochettes, photos d'artistes, genres) existent en plusieurs tailles :
// l'adresse contient « 250x250- », qu'on peut remplacer par « 500x500- » ou « 1000x1000- ».
// On donne toutes les tailles au navigateur (srcSet) : il prend la plus nette pour l'écran,
// sans télécharger trop gros. Les autres images (photos de profil…) restent telles quelles.
const SIZE = /\/\d+x\d+-/;

export function deezerAt(url: string, px: number): string {
  return url.replace(SIZE, `/${px}x${px}-`);
}

// Attributs à mettre sur <img> : sizes = la largeur affichée à l'écran.
export function sharpImage(url: string | null | undefined, sizes: string) {
  if (!url) return { src: undefined };
  if (!SIZE.test(url)) return { src: url };
  return {
    src: deezerAt(url, 500),
    srcSet: [250, 500, 1000].map((n) => `${deezerAt(url, n)} ${n}w`).join(", "),
    sizes,
  };
}
