export class ModelDownloadError extends Error {
  constructor(public code: 'idle-timeout' | 'total-timeout' | 'http' | 'incomplete' | 'network', message: string) {
    super(message);this.name = 'ModelDownloadError';
  }
}

/** A progressing download may exceed 90s; an idle connection must not wait indefinitely. */
export async function downloadModel(
  url: string, parentSignal: AbortSignal,
  onProgress: (received: number, total: number) => void,
  expectedBytes = 0,
  limits = { idleMs: 45000, totalMs: 300000 },
): Promise<ArrayBuffer> {
  const controller = new AbortController();
  let idle: ReturnType<typeof setTimeout>;
  let timeoutError: ModelDownloadError | undefined;
  const abort = () => controller.abort(parentSignal.reason);
  const expire = (code: 'idle-timeout' | 'total-timeout') => {
    timeoutError = new ModelDownloadError(code, code);controller.abort(timeoutError);
  };
  const progress = () => { clearTimeout(idle);idle = setTimeout(() => expire('idle-timeout'), limits.idleMs); };
  if (parentSignal.aborted) abort();else parentSignal.addEventListener('abort', abort, { once: true });
  const totalTimer = setTimeout(() => expire('total-timeout'), limits.totalMs);
  progress();
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new ModelDownloadError('http', `Model HTTP ${response.status}`);
    const total = expectedBytes || Number(response.headers.get('content-length'));
    const reader = response.body?.getReader();
    if (!reader) throw new ModelDownloadError('network', 'No response stream');
    const chunks: Uint8Array[] = [];let received = 0;
    while (true) {
      const { done, value } = await reader.read();if (done) break;
      if (!value.length) continue;
      progress();received += value.length;chunks.push(value);
      if (expectedBytes && received > expectedBytes) throw new ModelDownloadError('incomplete', 'Unexpected model size');
      onProgress(received, total);
    }
    if (!received || (expectedBytes && received !== expectedBytes)) throw new ModelDownloadError('incomplete', 'Incomplete model');
    const bytes = new Uint8Array(received);let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset);offset += chunk.length; }
    return bytes.buffer;
  } catch (error) {
    if (parentSignal.aborted) throw parentSignal.reason;
    if (timeoutError) throw timeoutError;
    if (error instanceof ModelDownloadError) throw error;
    throw new ModelDownloadError('network', String(error));
  } finally {
    clearTimeout(idle!);clearTimeout(totalTimer);
    parentSignal.removeEventListener('abort', abort);controller.abort();
  }
}
