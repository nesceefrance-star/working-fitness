# 💪 Workout Tracker — PWA

## Déployer sur Vercel (5 minutes)

### Option A — Via l'interface Vercel (le plus simple)

1. Va sur **vercel.com** → connecte-toi avec GitHub
2. Crée un repo GitHub et uploade ces fichiers
3. Dans Vercel → "New Project" → importe le repo
4. Framework : **Vite** (détecté automatiquement)
5. Clique **Deploy** → tu obtiens une URL type `workout-xxx.vercel.app`

### Option B — Via Vercel CLI

```bash
npm install -g vercel
npm install
vercel --prod
```

---

## Installer l'app sur iPhone

1. Ouvre l'URL sur **Safari** (pas Chrome !)
2. Tape l'icône **Partager** (carré avec flèche vers le haut)
3. Scroll et tape **"Sur l'écran d'accueil"**
4. Renomme si besoin → **Ajouter**

L'app s'ouvre en plein écran comme une vraie app native ✅

---

## Stack
- React 18 + Vite
- vite-plugin-pwa (Service Worker + manifest auto)
- localStorage pour la persistance de l'historique
- Giphy API pour les GIFs d'exercices
