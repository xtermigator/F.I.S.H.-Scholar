export interface AvatarClient {
  streamToVideoElement(id: string): Promise<void>;
  stopStreaming(): void;
  talk?(text: string): unknown;
  addListener?(event: any, listener: (value: any) => void): void;
}

interface ConnectOptions {
  signal: AbortSignal;
  fetcher?: typeof fetch;
  loadClient?: () => Promise<(token: string, options: { disableInputAudio: boolean }) => AvatarClient>;
}

/** Shares the server contract and teardown behavior between both avatar entry points. */
export async function connectAvatar(videoId: string, options: ConnectOptions) {
  const fetcher = options.fetcher ?? fetch;
  const signal = options.signal;
  signal.throwIfAborted();
  const response = await fetcher('/api/anam/session-token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientLabel: 'fish-scholar' }), signal,
  });
  const payload = await response.json();
  if (!response.ok || typeof payload?.sessionToken !== 'string' || !payload.sessionToken.trim()) {
    throw new Error(payload?.error || 'The avatar connection could not start. Check its settings and try again.');
  }
  signal.throwIfAborted();
  const loadClient = options.loadClient ?? (async () => {
    const sdk = await import('@anam-ai/js-sdk');
    return sdk.createClient;
  });
  const createClient = await loadClient();
  signal.throwIfAborted();
  // Text/explicit voice controls remain in charge of input. Opening video never enables a mic.
  const client = createClient(payload.sessionToken, { disableInputAudio: true });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    signal.removeEventListener('abort', close);
    try { client.stopStreaming(); } catch { /* Already disconnected. */ }
  };
  signal.addEventListener('abort', close, { once: true });
  try {
    await client.streamToVideoElement(videoId);
    if (signal.aborted) {
      // A delayed SDK start can settle after an earlier stop request.
      try { client.stopStreaming(); } catch { /* Already stopped. */ }
    }
    signal.throwIfAborted();
    return { client, close };
  } catch (error) {
    close();
    throw error;
  }
}
