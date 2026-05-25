import { useEffect } from 'react';
import { API_BASE_URL } from '../services/api';

export function useStationSse(onUpdate) {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/data/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5).trim());
                onUpdate(data);
              } catch {}
            }
          }
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('SSE error:', e);
        }
      }
    })();

    return () => controller.abort();
  }, []);
}
