# Cerul AR

Aplicație WebAR: îndrepți telefonul spre cer și vezi constelațiile, stelele, planetele, Luna, Soarele și ISS-ul suprapuse peste imaginea camerei. Rulează în browser pe iPhone (Safari) și Android (Chrome), fără instalare.

## Rulare

```bash
npm install
npm run dev          # HTTPS pe https://<ip-laptop>:5173 (pentru telefon, aceeași rețea)
```

- Pe telefon deschide adresa „Network” afișată de Vite și acceptă avertismentul de certificat (e self-signed).
- Pe laptop merge și cu mouse-ul: trage ca să te rotești, rotița face zoom.
- Pentru HTTP simplu pe laptop: `NO_SSL=1 npm run dev`.

## Cum funcționează

1. **Locația** (GPS) și **ora** → cu [Astronomy Engine](https://github.com/cosinekitty/astronomy) se calculează rotația cerului (J2000 → orizont local) și pozițiile Soarelui, Lunii și planetelor.
2. **Senzorii de orientare** (`deviceorientation` + busola) → orientarea camerei 3D (three.js) în sistemul Est / Sus / Sud.
3. Scena 3D e desenată transparent peste fluxul camerei (`getUserMedia`).
4. Când atingi un obiect, îl alegi pe cel mai apropiat de deget și primești detaliile lui. Butonul 🎯 te ghidează cu o săgeată până la obiect.

| Fișier | Rol |
|---|---|
| `src/astro.js` | calcule astronomice, conversii de coordonate |
| `src/orientation.js` | senzori → orientarea camerei, mod mouse pe laptop |
| `src/scene.js` | stele, linii de constelații, orizont, planete |
| `src/labels.js` | etichete HTML, selecție prin atingere |
| `src/iss.js` | poziția ISS live (api.wheretheiss.at) |
| `src/main.js` | legătura dintre toate + panouri |
| `src/texts.js` | texte în română |

## Date

Catalogul de stele și constelații vine din [d3-celestial](https://github.com/ofrohn/d3-celestial) (licență BSD-3) și e convertit cu `npm run sky-data -- <folder-date-d3-celestial>`.
