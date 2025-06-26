'use client';

import { useState, useEffect, ReactNode } from 'react';

const ClientOnly = ({ children }: { children: ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // On the server, render nothing.
  }

  return <>{children}</>; // On the client, render the children.
};

export default ClientOnly;