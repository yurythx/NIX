'use client';

import { ReactNode } from 'react';

export default function ArtigosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="artigos-layout">
      {children}
    </div>
  );
}
