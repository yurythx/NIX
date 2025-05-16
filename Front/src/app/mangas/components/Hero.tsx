import styles from '../styles/Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />
      <div className="container">
        <div className={styles.heroContent}>
          <h1>Bem-vindo ao MangaVerse</h1>
          <p>
            O seu portal definitivo para mangás, animes e cultura japonesa. Descubra os melhores
            títulos, notícias exclusivas e artigos aprofundados.
          </p>
          <a href="#" className={styles.btn}>
            Explorar Agora
          </a>
        </div>
      </div>
    </section>
  );
}
