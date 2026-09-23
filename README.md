# Recall Desk

A study tool using QVAC to turn private notes into study guides, questions, and simple explanations on your own computer.

## Install and run

Use Node.js 22 or newer on a supported laptop/desktop. Allow several GB of disk space for native SDK packages and the model, and preferably 8 GB or more of RAM.

```sh
npm install
npm run smoke
npm start
```

Open http://127.0.0.1:3210. Click **Try an example**, choose a study mode, and click **Make it click**. The app loads the model automatically, then streams your result. You can also preload it with **Load local model**. The first load may take several minutes.

## QVAC

The declared dependency is **@qvac/sdk 0.20.0**, pinned exactly. `src/engine.js` calls `loadModel`, `completion` and `unloadModel`. It uses the SDK's `LLAMA_3_2_1B_INST_Q4_0` model with CPU inference. The first model load downloads weights; subsequent loads use QVAC's cache. First-time setup requires internet. Inference uses the computer running Node, not a remote AI service. This is a desktop local app, not a standalone phone browser app.

The application sends notes only to its loopback server. It has no analytics, cloud AI API, login, API key, or automatic note persistence. The SDK can use network connections for package/model downloads and P2P discovery; local inference does not mean zero network traffic during setup. For a fully offline session, finish setup, disconnect the network, and verify a second generation succeeds.

Optionally set `QVAC_MODEL_PATH` to an absolute path to a compatible instruct GGUF already on your device. This replaces the default model source. Port can be set using `PORT`; only the 127.0.0.1 interface is used.

AI-generated study material can be wrong. Check answers against your notes. The app limits notes to 6,000 characters and generated output to 900 tokens; unusually token-dense text can still exceed the model context.

## License and sources

Original application code is MIT licensed. Model weights and the SDK retain their separate upstream licenses; Llama weights are subject to Meta's model license.

- [QVAC quickstart](https://docs.qvac.tether.io/js-ts-sdk/)
- [QVAC API reference](https://docs.qvac.tether.io/reference/api/)
- [QVAC source](https://github.com/tetherto/qvac)

This is an original app, not a fork of the QVAC examples.

## Final workspace features

- Three modes: study guide, practice questions with answer key, and simple explanation.
- Streamed output and live model-download status, with explicit errors and retry.
- Local `.txt` / `.md` import, clipboard copy, Markdown download and clear-session controls.
- No automatic disk or browser-storage persistence of notes. Exports are saved only when you choose to download them. Clearing the UI does not securely erase process memory, clipboard contents or previous exports; quit the app to unload the model.

## Testing and a real screenshot

```sh
npm test
npm run smoke
```

`npm test` checks input validation and the HTTP boundary without downloading a model. `npm run smoke` must run the actual QVAC model and print a study guide; there is no fake-inference mode. See `VALIDATION.md` for what was and was not verified in the build environment.

For a screenshot, run `npm start`, open the app, click **Try an example** and **Make it click**, then capture the finished output using your OS screenshot tool. Save it under `docs/recall-desk-running.png` before your final commit. Do not use an empty UI screenshot as proof of working AI.

Optional automatic capture (with the app still running in another terminal):

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node scripts/capture.mjs
```

Playwright is an optional capture tool, not an inference dependency. The script waits up to 20 minutes for a real generation and saves the screenshot plus the visible text only after success. Install Chromium system dependencies if Playwright requests them. Once captured, you can add `![Recall Desk running](docs/recall-desk-running.png)` to this README.

## Troubleshooting

- `listen EPERM` from QVAC: this runtime blocks native worker IPC. Run the app in a normal local desktop environment that supports QVAC; an ordinary static website host cannot run this app.
- Native binary or library error: check QVAC's current platform prerequisites and supported CPU architecture. Windows users should check the SDK's current Windows support or use an appropriate Linux environment.
- Slow or stuck first load: model distribution requires network access and may take several minutes. Check firewall/network connectivity, or set `QVAC_MODEL_PATH` to a locally downloaded compatible instruct GGUF. Restart after changing environment variables.
- Out of memory/context: close other heavy apps and use a shorter excerpt. The included 1B quantized model favors modest resource use over large-model accuracy.
- Open the exact `127.0.0.1` URL printed by the server. The local Host checks intentionally reject other hostnames.
- A generation continues on the local worker if its browser tab disconnects, to avoid overlapping requests; there is no cancellation button. Stop the server with Ctrl+C when finished.

## Publish with three commits

See [COMMIT_PLAN.md](COMMIT_PLAN.md) for the exact snapshot order and commit messages. [X_POST.txt](X_POST.txt) contains the draft post. The ZIPs do not contain a pre-authored Git history; your own Git configuration provides the required author identity.
