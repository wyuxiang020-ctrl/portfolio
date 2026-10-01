import { downloadModel, ModelDownloadError } from './model-download';

class RangeUnavailable extends Error {}
const incomplete = (message: string) => new ModelDownloadError('incomplete', message);

/** Same complete GLB, bounded parallel transport. Never send mixed/incomplete bytes to GLTFLoader. */
export async function downloadModelInRanges(
  url: string, parentSignal: AbortSignal,
  onProgress: (received: number, total: number, mode?: 'ranges' | 'full' | 'full-fallback') => void,
  expectedBytes: number, expectedHash: string,
  options = { chunkBytes: 524288, concurrency: 4, idleMs: 45000, totalMs: 300000 },
): Promise<ArrayBuffer> {
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes <= 0 || !/^[a-f0-9]{64}$/i.test(expectedHash)) throw incomplete('Missing model identity');
  if (!Number.isSafeInteger(options.chunkBytes) || options.chunkBytes < 1 || !Number.isSafeInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 4) throw incomplete('Invalid transfer bounds');
  const attempt = new AbortController();
  const ranges = new AbortController();
  const cancel = () => attempt.abort(parentSignal.reason);
  const cancelRanges = () => ranges.abort(attempt.signal.reason);
  if (parentSignal.aborted) cancel();else parentSignal.addEventListener('abort', cancel, { once: true });
  attempt.signal.addEventListener('abort', cancelRanges, { once: true });
  if (attempt.signal.aborted) cancelRanges();
  const totalTimer = setTimeout(() => attempt.abort(new ModelDownloadError('total-timeout', 'Model download exceeded total limit')), options.totalMs);
  const output = new Uint8Array(expectedBytes);
  let etag = '', completed = 0;
  const workers: Promise<void>[] = [];

  async function verify(buffer: ArrayBuffer) {
    attempt.signal.throwIfAborted();
    const view = new DataView(buffer);
    if (buffer.byteLength !== expectedBytes || buffer.byteLength < 12 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== expectedBytes) throw incomplete('Invalid GLB header');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)), b => b.toString(16).padStart(2, '0')).join('');
    attempt.signal.throwIfAborted();
    if (hash !== expectedHash.toLowerCase()) throw incomplete('Model checksum mismatch');
    return buffer;
  }

  async function segment(start: number): Promise<boolean> {
    const end = Math.min(start + options.chunkBytes, expectedBytes) - 1;
    const request = new AbortController();
    const abort = () => request.abort(ranges.signal.reason);
    ranges.signal.addEventListener('abort', abort, { once: true });
    if (ranges.signal.aborted) abort();
    let idle: ReturnType<typeof setTimeout>;
    const touch = () => { clearTimeout(idle);idle = setTimeout(() => request.abort(new ModelDownloadError('idle-timeout', 'Model range stalled')), options.idleMs); };
    touch();
    try {
      request.signal.throwIfAborted();
      const response = await fetch(url, { signal: request.signal, headers: { Range: `bytes=${start}-${end}`, ...(etag ? { 'If-Range': etag } : {}) } });
      const full = response.status === 200 && start === 0;
      if (response.status === 200 && !full) { await response.body?.cancel();throw new RangeUnavailable('Server stopped honoring ranges'); }
      if (!full) {
        if (response.status !== 206) throw new ModelDownloadError('http', `Model HTTP ${response.status}`);
        const encoding = response.headers.get('content-encoding');
        if (encoding && encoding !== 'identity') { await response.body?.cancel();throw new RangeUnavailable('Encoded byte ranges'); }
        const range = response.headers.get('content-range');
        if (range !== `bytes ${start}-${end}/${expectedBytes}`) throw incomplete('Unexpected Content-Range');
        const tag = response.headers.get('etag') || '';
        if (!/^"[^"]+"$/.test(tag)) { await response.body?.cancel();throw new RangeUnavailable('No strong version validator'); }
        if (etag && tag !== etag) throw incomplete('Model version changed during transfer');
        etag = tag;
      }
      const reader = response.body?.getReader();
      if (!reader) throw new ModelDownloadError('network', 'No response stream');
      const size = full ? expectedBytes : end - start + 1;
      let received = 0;
      while (true) {
        const { value, done } = await reader.read();if (done) break;
        request.signal.throwIfAborted();
        if (!value.length) continue;
        touch();
        if (received + value.length > size) throw incomplete('Range longer than expected');
        output.set(value, (full ? 0 : start) + received);received += value.length;
        if (full) onProgress(received, expectedBytes, 'full');
      }
      request.signal.throwIfAborted();
      if (received !== size) throw incomplete('Truncated model range');
      if (!full) { completed += received;onProgress(completed, expectedBytes, 'ranges'); }
      return full;
    } catch (error) {
      if (request.signal.aborted) throw request.signal.reason;
      if (error instanceof ModelDownloadError || error instanceof RangeUnavailable) throw error;
      throw new ModelDownloadError('network', String(error));
    } finally {
      clearTimeout(idle!);ranges.signal.removeEventListener('abort', abort);request.abort();
    }
  }

  try {
    attempt.signal.throwIfAborted();onProgress(0, expectedBytes);
    try {
      const full = await segment(0);
      if (!full) {
        let next = options.chunkBytes;
        for (let i = 0; i < options.concurrency; i++) workers.push((async () => {
          while (next < expectedBytes) {
            ranges.signal.throwIfAborted();
            const start = next;next += options.chunkBytes;
            await segment(start);
          }
        })());
        await Promise.all(workers);
      }
      return await verify(output.buffer);
    } catch (error) {
      ranges.abort(error);await Promise.allSettled(workers);
      attempt.signal.throwIfAborted();
      if (!(error instanceof RangeUnavailable)) throw error;
      // Exactly one full-response fallback. Outer deadline is still running.
      onProgress(0, expectedBytes, 'full-fallback');
      const data = await downloadModel(url, attempt.signal, (n, total) => onProgress(n, total, 'full-fallback'), expectedBytes, { idleMs: options.idleMs, totalMs: options.totalMs });
      return await verify(data);
    }
  } finally {
    clearTimeout(totalTimer);parentSignal.removeEventListener('abort', cancel);
    attempt.signal.removeEventListener('abort', cancelRanges);ranges.abort();attempt.abort();
  }
}
