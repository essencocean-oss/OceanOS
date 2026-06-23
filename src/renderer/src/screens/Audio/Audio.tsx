import { useEffect } from 'react';

export default function AudioBridge() {
  useEffect(() => {
    let cancelled = false;

    async function handleSpeech(_: string) {
      if (cancelled) return;
    }

    const unsubscribe: (() => void) | undefined =
      (window as any).__ride?.onSpeech?.bind(
        (window as any).__ride,
        handleSpeech,
      );

    return () => {
      cancelled = true;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return null;
}
