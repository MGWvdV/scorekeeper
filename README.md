# Score Keeper — PWA

A mobile-first score keeping app for card games (Toepen, Boerenbridge) and a general-purpose counter.

## Features
- **Toepen**: Full game flow with stake tracking, toep/quit mechanics, winner selection
- **Boerenbridge**: Round-by-round bid & trick tracking with configurable scoring rules
- **Counter**: Simple score tracker with custom point input
- Persistent recent players & settings (survives closing the browser)
- Works offline once loaded
- Add to iPhone home screen for app-like experience

## Deploy to Vercel (free, ~5 minutes)

### Option A: Via GitHub (recommended)
1. Create a GitHub account if you don't have one: https://github.com
2. Install Git if needed: https://git-scm.com
3. Push this folder to a new GitHub repo:
   ```bash
   cd scorekeeper
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/scorekeeper.git
   git push -u origin main
   ```
4. Go to https://vercel.com and sign in with GitHub
5. Click "Add New Project" → Import your scorekeeper repo
6. Click "Deploy" — done! You'll get a URL like `scorekeeper-abc123.vercel.app`

### Option B: Via Vercel CLI
1. Install: `npm i -g vercel`
2. Run: `cd scorekeeper && npm install && vercel`
3. Follow the prompts

## Install on iPhone
1. Open your Vercel URL in Safari on your iPhone
2. Tap the **Share button** (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Score Keeper" and tap Add
5. Done! It now has its own icon and opens without the Safari bar

## Local development
```bash
npm install
npm run dev
```
Opens at http://localhost:5173
