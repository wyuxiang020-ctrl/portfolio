import { downloadModel } from './model-download';
import { downloadModelInRanges } from './model-range-download';

export interface ModelPreparationMetrics {
  bytes: number;
  requestedTransport?: string;
  transport?: string;
  downloadStartedMs?: number;
  firstProgressMs?: number;
  downloadMs?: number;
  downloadFinishedMs?: number;
  moduleReadyMs?: number;
}

export interface PreparedModel {
  data: ArrayBuffer;
  metrics: ModelPreparationMetrics;
}

/** No Three.js dependency: start the existing transfer while the viewer module loads. */
export async function prepareModel(
  source: { modelUrl?: string; modelBytes?: string; modelTransport?: string; modelSha256?: string },
  signal: AbortSignal,
  onProgress: (bytes: number, total: number) => void,
  clickedAt: number,
  metrics: ModelPreparationMetrics,
): Promise<PreparedModel> {
  const started = performance.now();
  metrics.downloadStartedMs = Math.round(started - clickedAt);
  const useRanges = source.modelTransport === 'ranges' && !!globalThis.crypto?.subtle;
  metrics.requestedTransport = useRanges ? 'ranges' : 'single';
  const progress = (bytes: number, total: number, mode?: string) => {
    if (signal.aborted) return;
    metrics.bytes = bytes;
    if (mode) metrics.transport = mode;
    else if (!useRanges && bytes > 0) metrics.transport = 'single';
    // Range progress arrives after a validated segment; this is not network first-byte timing.
    if (bytes > 0 && metrics.firstProgressMs === undefined) metrics.firstProgressMs = Math.round(performance.now() - clickedAt);
    onProgress(bytes, total);
  };
  try {
    signal.throwIfAborted();
    const expectedBytes = Number(source.modelBytes) || 0;
    const data = useRanges
      ? await downloadModelInRanges(source.modelUrl!, signal, progress, expectedBytes, source.modelSha256!)
      : await downloadModel(source.modelUrl!, signal, progress, expectedBytes);
    signal.throwIfAborted();
    metrics.downloadFinishedMs = Math.round(performance.now() - clickedAt);
    return { data, metrics };
  } finally {
    metrics.downloadMs = Math.round(performance.now() - started);
  }
}
