# Money Debt Tracker PWA

This is an offline website/app for tracking:

- People who borrowed from you
- People you borrowed from
- Amount
- Date borrowed
- Status
- Weekly totals
- Net balance

## Folder hierarchy

money-debt-tracker-pwa/
├── index.html
├── styles.css
├── app.js
├── manifest.json
├── sw.js
└── assets/
    ├── icon-192.png
    └── icon-512.png

## How to run in VS Code

1. Open this folder in VS Code.
2. Install the VS Code extension called **Live Server**.
3. Right-click `index.html`.
4. Click **Open with Live Server**.
5. The app will open in your browser.

Alternatively, from a terminal you can run a simple HTTP server:

```bash
# from the project folder
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

## Install on Android

1. Open the Live Server URL in Chrome.
2. Tap the menu.
3. Choose **Add to Home screen** or **Install app**.

## Install on iPhone

1. Open the site in Safari.
2. Tap the Share button.
3. Tap **Add to Home Screen**.
4. Tap **Add**.

## Install on Windows

1. Open the site in Chrome or Edge.
2. Click the install icon in the address bar, or use browser menu.
3. Choose **Install app**.

## Important

The data is stored on the device/browser using localStorage. If you clear browser data, records may be deleted. Use **Export JSON** for backup.

## Quick test checklist

1. Open the app in a browser (Live Server or `python -m http.server`).
2. Add a record:
    - `Person Name`: e.g. "John Doe"
    - `Amount`: enter a positive number
    - `Date`: pick today or another date
    - `Type`: choose "This person borrowed from me" or "I owe this person"
    - `Status`: choose "Not paid" (internally `open`) or "Paid"
3. Click **Save Record** — the record should appear in the **Saved Records** table.
4. Confirm the **Records** count and summary totals at the top update accordingly.
5. Use **Export JSON** to download a backup, and **Import JSON** to restore it.

If anything doesn't appear after saving, open the browser console (F12) and check for errors; report them here and I'll help fix them.
