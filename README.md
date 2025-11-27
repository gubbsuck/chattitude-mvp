# Chattitude MVP

AI-powered konstruktiv debatt träning

## Deployment till Vercel

### Steg 1: Skapa GitHub Repository

1. Gå till [GitHub](https://github.com) och logga in
2. Klicka på "New repository"
3. Namnge den t.ex. `chattitude-mvp`
4. Sätt den som **Public** eller **Private**
5. **Klicka INTE** i "Initialize with README"
6. Klicka "Create repository"

### Steg 2: Ladda upp kod till GitHub

Kopiera och kör dessa kommandon i din terminal:

\`\`\`bash
# Navigera till projektmappen
cd [sökväg-till-denna-mapp]

# Initiera git
git init

# Lägg till alla filer
git add .

# Gör första commit
git commit -m "Initial commit - Chattitude MVP"

# Lägg till GitHub som remote (byt ut URL:en med din egen från GitHub)
git remote add origin https://github.com/DITT-ANVÄNDARNAMN/chattitude-mvp.git

# Pusha till GitHub
git branch -M main
git push -u origin main
\`\`\`

### Steg 3: Deploya till Vercel

1. Gå till [Vercel](https://vercel.com) och logga in (använd GitHub-konto)
2. Klicka på "Add New..." → "Project"
3. Importera ditt `chattitude-mvp` repository
4. Vercel detekterar automatiskt Next.js inställningar
5. Klicka "Deploy"
6. Vänta 1-2 minuter - klart! 🎉

Din app kommer få en URL som: `chattitude-mvp.vercel.app`

## Lokal utveckling

\`\`\`bash
npm install
npm run dev
\`\`\`

Öppna [http://localhost:3000](http://localhost:3000)

## Viktigt

Anthropic API-nycklar hanteras på klientsidan i denna MVP. För produktion bör du:
- Flytta API-anrop till Next.js API Routes
- Använda miljövariabler för API-nycklar
- Lägga till rate limiting
