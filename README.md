# OnlyWL

En minimal webbläsare med vitlista. Starta appen, skriv en tillåten adress per rad (eller välj en sparad grupp) och tryck **surf**. Varje sida öppnas i en egen flik. Navigering till sidor utanför vitlistan blockeras.

## Utveckling (webbförhandsvisning)

```bash
npm install
npm run dev
```

## Skrivbordsapp (Electron)

Electron är inte med i standardinstallationen (stort paket). Installera en gång:

```bash
npm install -D electron @electron/packager
```

Bygg och starta:

```bash
npm run electron:build   # bygger en statisk bundle till dist/
npm run electron:start   # startar skrivbordsappen
```

Skapa en .exe (Windows, x64):

```bash
npm run electron:package   # resultatet hamnar i release/OnlyWL-win32-x64/
```

Cookies och cache sparas på datorn (Electron-partition `persist:onlyw`), och sparade grupper ligger i appens lokala lagring.
