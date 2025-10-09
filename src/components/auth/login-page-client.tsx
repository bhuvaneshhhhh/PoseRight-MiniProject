'use client';

import { useEffect, useState } from 'react';
import { LoginForm } from './login-form';

export default function LoginPageClient() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <>{isClient && <LoginForm />}</>;
}
