// All inference happens inside QVAC's native worker on this computer.
// Dynamic import lets the UI report installation errors instead of failing to open.
import { log } from './logger.js';
let sdk;
let modelId;
let loading;
let busy = false;
const state = { phase: 'idle', progress: null, error: null };

export function modelStatus() { return { ...state, busy }; }

export async function loadLocalModel() {
  if (modelId) return modelId;
  if (loading) return loading;
  loading = (async () => {
    state.phase = 'loading';
    state.error = null;
    state.progress = null;
    let lastProgress = -1;
    let downloadStarted = false;
    log('Loading local model (downloads on first use)...');
    const heartbeat = setInterval(() => log('Waiting for model load to finish...'), 15000);
    heartbeat.unref();
    try {
      sdk ??= await import('@qvac/sdk');
      modelId = await sdk.loadModel({
        modelSrc: process.env.QVAC_MODEL_PATH || sdk.LLAMA_3_2_1B_INST_Q4_0,
        modelConfig: { ctx_size: 8192, device: 'cpu' },
        onProgress(p) {
          state.progress = Number.isFinite(p.percentage) ? Math.max(0, Math.min(100, p.percentage)) : null;
          const percent = state.progress === null ? null : Math.floor(state.progress);
          if (!downloadStarted || (percent !== null && (percent >= lastProgress + 5 || (percent === 100 && lastProgress !== 100)))) {
            const size = Number.isFinite(p.downloaded) && Number.isFinite(p.total) && p.total > 0
              ? ` (${(p.downloaded / 1048576).toFixed(1)} / ${(p.total / 1048576).toFixed(1)} MB)` : '';
            log(`Downloading model${percent === null ? '...' : `: ${percent}%`}${size}`);
            downloadStarted = true;
            if (percent !== null) lastProgress = percent;
            if (percent === 100) log('Download complete. Loading model into memory...');
          }
        }
      });
      state.phase = 'ready';
      state.progress = 100;
      log('Model ready. Running locally on CPU.');
      return modelId;
    } catch (error) {
      state.phase = 'error';
      state.error = error.message;
      log(`Model load failed: ${error.message}`);
      throw error;
    } finally { clearInterval(heartbeat); loading = null; }
  })();
  return loading;
}

export async function* generate(history) {
  if (busy) throw new Error('A study session is already generating. Please wait.');
  busy = true;
  let heartbeat;
  try {
    const id = await loadLocalModel();
    const started = Date.now();
    let characters = 0;
    log('Thinking...');
    heartbeat = setInterval(() => log(characters ? 'Still generating answer...' : 'Still thinking...'), 10000);
    heartbeat.unref();
    const run = sdk.completion({
      modelId: id, history, stream: true,
      generationParams: { temp: 0.3, predict: 900 }
    });
    // Consume QVAC's documented stream; no remote AI endpoint or fallback.
    for await (const token of run.tokenStream) {
      if (token && !characters) log('Generating answer...');
      characters += token.length;
      yield token;
    }
    if (!characters) throw new Error('The model returned no text. Try again with shorter notes.');
    log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s. Ready for the next request.`);
  } catch (error) {
    log(`Request failed: ${error.message}`);
    throw error;
  } finally { clearInterval(heartbeat); busy = false; }
}

export async function shutdown() {
  if (loading) await loading.catch(() => {});
  if (modelId) {
    log('Unloading model...');
    await sdk.unloadModel({ modelId });
  }
  modelId = undefined;
  if (sdk?.close) await sdk.close();
}
