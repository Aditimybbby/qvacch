# Recall Desk

A study tool using QVAC to turn private notes into study guides, questions, and simple explanations on your own computer.

## Install and run

Use Node.js 22 or newer on a supported laptop/desktop. Allow several GB of disk space for native SDK packages and the model, and preferably 8 GB or more of RAM.

```sh
npm install
npm run smoke
npm start
```

Open http://127.0.0.1:3210. This first snapshot contains the local engine and a placeholder landing page; the smoke command runs real inference. The next snapshot adds the interactive workspace.

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


## Build-environment verification

The real SDK installed and its exports were checked. A native worker IPC restriction (`listen EPERM`) prevented a successful inference run in the build environment. Run `npm run smoke` on your own machine before submitting; this archive does not contain proof of working AI output.
