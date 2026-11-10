import { Composition } from "remotion";
import { Duel, type DuelProps } from "./Duel";

const example: DuelProps = {
  hook: "Deux albums, deux ambiances",
  left_line: "Une atmosphère à part",
  right_line: "Des titres qui restent en tête",
  question: "Lequel tu remets en premier ?",
  left: {
    title: "Exemple — album A",
    artist: "Artiste A",
    coverUrl: "https://placehold.co/700x700/123326/ffffff.jpg?text=Album+A",
    averageRating: 4.2,
    reviewCount: 18,
  },
  right: {
    title: "Exemple — album B",
    artist: "Artiste B",
    coverUrl: "https://placehold.co/700x700/2e9e6b/ffffff.jpg?text=Album+B",
    averageRating: 4.0,
    reviewCount: 14,
  },
  caption: "Deux albums à découvrir sur Pépite. Lequel choisis-tu ?",
  hashtags: ["#Pépite", "#musique"],
};

export function Root() {
  return (
    <Composition
      id="DuelMusical"
      component={Duel}
      durationInFrames={225}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={example}
    />
  );
}
