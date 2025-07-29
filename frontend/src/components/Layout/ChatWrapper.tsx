'use client';

import { useEffect, useState } from 'react';
import ChatContainer from '@/components/Chat/ChatContainer';
import useAuthStore from '@/Zustand_Store/AuthStore';

export default function ChatWrapper() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <ChatContainer isAuthenticated={isAuthenticated} />;
} 