'use client';

import type { ReactNode } from 'react';
import { ThemeProviderWrapper } from '@/app/context/ThemeContext';
import { AuthProvider } from '@/app/context/AuthContext';
import LocaleSwitchPromptDialog from '@/app/components/common/LocaleSwitchPromptDialog';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProviderWrapper>
      <AuthProvider>
        {children}
        <LocaleSwitchPromptDialog />
      </AuthProvider>
    </ThemeProviderWrapper>
  );
}
