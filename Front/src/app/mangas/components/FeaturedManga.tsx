import styles from '../styles/FeaturedManga.module.css';
import Image from 'next/image';
import Link from 'next/link';

// Tipagem para Manga
interface Manga {
  title: string;
  description: string;
  status: string;
  rating: number;
  image: string;
}

// Dados simulados de mangás
const mangas: Manga[] = [
  {
    title: 'One Piece',
    description: 'Monkey D. Luffy parte para se tornar o Rei dos Piratas.',
    status: 'Em andamento',
    rating: 9.8,
    image: '/mangas/one-piece.jpg',
  },
  {
    title: 'Naruto',
    description: 'Um ninja determinado busca reconhecimento e poder.',
    status: 'Completo',
    rating: 9.5,
    image: '/mangas/naruto.jpg',
  },
];

// Função para criar o slug das URLs
function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-');
}

export default function FeaturedManga() {
  return (
    <section>
      <h2 className="section-title">Mangás em Destaque</h2>
      <div className={styles.featuredContainer}>
        {mangas.map((manga, index) => (
          <div className={styles.mangaCard} key={index}>
            <Link href={`/manga/${slugify(manga.title)}`}>
              <Image
                src={manga.image}
                alt={`Capa do mangá ${manga.title}`}
                width={300}
                height={250}
                className={styles.image}
              />
            </Link>
            <div className={styles.mangaInfo}>
              <Link href={`/manga/${slugify(manga.title)}`}>
                <h3 className={styles.link}>{manga.title}</h3>
              </Link>
              <p>{manga.description}</p>
              <div>
                <span className={styles.tag}>{manga.status}</span>
              </div>
              <div className={styles.rating}>★ {manga.rating}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}