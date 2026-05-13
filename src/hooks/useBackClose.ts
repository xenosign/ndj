import { useEffect, useRef } from 'react';

export function useBackClose(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    let closedByBack = false;

    window.history.pushState(null, '');

    const handlePopState = () => {
      closedByBack = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByBack) window.history.back();
    };
  }, [open]);
}
