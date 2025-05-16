'use client';

import { ReactNode } from 'react';

export default function MangasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mangas-layout">
      {children}
    </div>
  );
}
