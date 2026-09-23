# Publish the three snapshots as three commits

These ZIPs are successive source snapshots of **one original app**, not three separate submissions and not Git repositories with fabricated authorship. Each ZIP includes the complete source at that stage. Extract the files; do not upload the ZIP archives themselves as the repository's code.

## 1. Core engine

Extract `recall-desk-commit-1.zip` into a new empty directory called `recall-desk`.
In that directory, run:

```sh
git init -b main
git config user.name "YOUR NAME"
git config user.email "YOUR VERIFIED GITHUB EMAIL OR GITHUB NOREPLY EMAIL"
git add .
git commit -m "feat: add local QVAC study engine and smoke runner"
```

Replace the two identity placeholders with your own details. An email linked to your GitHub account makes GitHub attribute the commits to you.

## 2. Study workspace

Extract `recall-desk-commit-2.zip` into **the same directory**, replacing existing files. Keep the `.git` directory created above.

```sh
git add .
git commit -m "feat: add streaming study workspace and model progress"
```

## 3. Import, export and submission tools

Extract `recall-desk-commit-3.zip` into **the same directory**, replacing existing files. Keep `.git`.

Before making the third commit, install and verify the final app:

```sh
npm ci
npm test
npm run smoke
npm start
```

Open `http://127.0.0.1:3210`, generate from the example, and take a screenshot with the actual AI output visible. Optional automated capture is described in `README.md`; it writes into `docs/`, so the screenshot can be included in this third commit.

Only after confirming local inference and capturing evidence:

```sh
git add .
git commit -m "feat: add note import, exports, tests and submission evidence"
git log --oneline
```

There must be at least three commits, attributed to your own account. If you need fixes, make additional commits; the requirement is a minimum, not exactly three.

## Publish

Create an empty **public** GitHub repository called `recall-desk`. Do not initialize it with a README or license; those are already here. Then:

```sh
git remote add origin https://github.com/YOUR_USERNAME/recall-desk.git
git push -u origin main
```

Authenticate using your own GitHub credentials. Never put a token in the source or ZIPs.

Alternatively, upload each snapshot's extracted files through GitHub's web interface, one snapshot per commit. Make sure the final repository contains `package.json`, `package-lock.json`, the source folders, README, MIT license and your genuine screenshot. Upload files from the ZIP, not a containing folder that would nest the app repeatedly.

## X post and submission

Replace the repository placeholder in `X_POST.txt`, attach the real screenshot, then post using your own X account. The draft tags `@qvac`. It is not already published.

Submit your public repository URL, the resulting X post URL, your screenshot, and:

> Recall Desk turns private notes into study guides, practice questions and simple explanations on your own computer. It uses QVAC SDK 0.20.0 and calls `loadModel` and `completion` for local inference.

Optional motivation: “I wanted to revise personal notes without sending them to a cloud AI.” Use that only if it reflects your motivation.

## Remaining verification

This workspace installed the real SDK and verified its exported functions, but blocked the SDK's local worker IPC socket with `EPERM`. No successful model run or AI-output screenshot was produced here. The final app must pass the local smoke run and real screenshot step on your machine before submitting. No GitHub repo or X post was created by this package.
