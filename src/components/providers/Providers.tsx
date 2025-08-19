"use client";

import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      {/* TODO: Add React Query Provider, Auth Provider, etc. */}
      {children}
    </>
  );
}
