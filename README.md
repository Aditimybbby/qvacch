# Recall Desk

Turn your notes into study guides, practice questions, and simple explanations using AI on your own computer. Powered by **QVAC SDK 0.20.0** and **Llama 3.2 1B**, using `loadModel` and `completion`.

## Install — once

Install **Node.js 22 or newer**. Download and extract the app, or clone its repository.

Open a terminal **inside the folder containing `package.json`**. On Windows, open that folder in File Explorer, type `cmd` in the address bar, and press Enter.

Run:

```sh
npm install
```

Wait for installation to finish successfully. You only need to repeat this if the app's dependencies change.

## Start — each time

From the same project folder, run:

```sh
npm start
```

Open [Recall Desk](http://127.0.0.1:3210) in your browser. Keep the terminal open while using the app; press **Ctrl+C** to stop.

## Use the app

1. Paste your notes, import a `.txt` / `.md` file, or click **Try an example**.
2. Choose a study guide, practice questions, or a simple explanation.
3. Click **Make it click**. The model loads automatically.
4. Copy the result or download it as Markdown.

The first model load needs internet and may take several minutes. QVAC caches the model for later runs. The terminal shows download progress, model readiness, thinking, and completion. Notes stay on your computer; no cloud AI API key is needed.

`npm run smoke` is an **optional** model test, not a required startup step. `npm test` runs the app's automated checks.

---

[MIT License](LICENSE) · [Share on X](https://x.com/intent/post?text=Built%20Recall%20Desk%20with%20%40qvac%3A%20turn%20private%20notes%20into%20study%20guides%2C%20practice%20questions%20and%20simple%20explanations%20on%20your%20laptop.%20Local%20inference.%20Open%20source%20under%20MIT.)
