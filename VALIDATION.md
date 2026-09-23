# Validation status

- Installed and locked `@qvac/sdk` at 0.20.0 using npm.
- Imported the real package and confirmed `loadModel`, `completion`, `unloadModel` and `close` are exported functions, and the Llama 3.2 model constant exists.
- JavaScript syntax checks completed for the app, engine, server and screenshot script.
- The test suite exercises note validation, static serving, same-origin/Host checks and malformed API requests. It does not substitute mocks for real QVAC inference.
- **End-to-end inference is unverified.** `npm run smoke` reached QVAC but the execution workspace denied the native worker's Unix socket with `listen EPERM`. The failure happened before model inference.
- **No AI-output screenshot is included.** `scripts/capture.mjs` is a local capture helper that refuses to save a screenshot unless the app reports a completed real generation with output. It still needs to be run on a supported local machine.
- No public GitHub repo or X post has been published. Use `COMMIT_PLAN.md` to create the commits under your own Git identity.

Do not describe this package as a completed, validated challenge submission until local inference, screenshot capture and publishing are done.
