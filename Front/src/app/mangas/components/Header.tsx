'use client';
import styles from '../styles/Header.module.css';
import { useState } from 'react';

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`${styles.navbar} container`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>M</div>
          Manga<span className={styles.accent}>Verse</span>
        </div>

        <button
          className={styles.mobileNavToggle}
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Abrir menu de navegação"
        >
          ☰
        </button>

        <ul
          className={`${styles.navLinks} ${
            mobileMenu ? styles.active : ''
          }`}
        >
          <li><a href="#">Início</a></li>
          <li>
            <a href="#">Categorias</a>
            <ul className={styles.dropdown}>
              <li><a href="#">Ação</a></li>
              <li><a href="#">Romance</a></li>
              <li><a href="#">Fantasia</a></li>
              <li><a href="#">Comédia</a></li>
            </ul>
          </li>
          <li><a href="#">Populares</a></li>
          <li><a href="#">Sobre</a></li>
        </ul>
      </div>
    </header>
  );
}