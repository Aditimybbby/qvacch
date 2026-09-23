// All inference happens inside QVAC's native worker on this computer.
// Dynamic import lets the UI report installation errors instead of failing to open.
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
    try {
      sdk ??= await import('@qvac/sdk');
      modelId = await sdk.loadModel({
        modelSrc: process.env.QVAC_MODEL_PATH || sdk.LLAMA_3_2_1B_INST_Q4_0,
        modelConfig: { ctx_size: 8192, device: 'cpu' },
        onProgress(p) {
          state.progress = Number.isFinite(p.percentage) ? Math.max(0, Math.min(100, p.percentage)) : null;
        }
      });
      state.phase = 'ready';
      state.progress = 100;
      return modelId;
    } catch (error) {
      state.phase = 'error';
      state.error = error.message;
      throw error;
    } finally { loading = null; }
  })();
  return loading;
}

export async function* generate(history) {
  if (busy) throw new Error('A study session is already generating. Please wait.');
  busy = true;
  try {
    const id = await loadLocalModel();
    const run = sdk.completion({
      modelId: id, history, stream: true,
      generationParams: { temp: 0.3, predict: 900 }
    });
    // Consume QVAC's documented stream; no remote AI endpoint or fallback.
    for await (const token of run.tokenStream) yield token;
  } finally { busy = false; }
}

export async function shutdown() {
  if (loading) await loading.catch(() => {});
  if (modelId) await sdk.unloadModel({ modelId });
  modelId = undefined;
  if (sdk?.close) await sdk.close();
}
