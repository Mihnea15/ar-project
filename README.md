# Cerul AR

Aplicație WebAR: îndrepți telefonul spre cer și vezi constelațiile, stelele, planetele, Luna, Soarele și ISS-ul suprapuse peste imaginea camerei. Rulează în browser pe iPhone (Safari) și Android (Chrome), fără instalare.

**Online:** https://mihnea15.github.io/ar-project/ (se publică automat la fiecare push pe `main`, prin GitHub Actions)

## Rulare

```bash
npm install
npm run dev          # HTTPS pe https://<ip-laptop>:5173 (pentru telefon, aceeași rețea)
```

- Pe telefon deschide adresa „Network” afișată de Vite și acceptă avertismentul de certificat (e self-signed).
- Pe laptop merge și cu mouse-ul: trage ca să te rotești, rotița face zoom.
- Pentru HTTP simplu pe laptop: `NO_SSL=1 npm run dev`.

### Test pe iPhone fără rețea comună (hotspot)

1. Pornește **Hotspot personal** pe iPhone și conectează laptopul la el.
2. Pe Windows, rețeaua hotspot e de obicei „Publică”, iar firewall-ul blochează conexiunile spre Node. Setează rețeaua ca **Privată** (Setări → Rețea → proprietățile rețelei) sau permite `node.exe` și pe rețele publice când apare fereastra firewall-ului.
3. `npm run dev` și deschide pe iPhone, în Safari, adresa „Network” (de forma `https://172.20.10.x:5173`).
4. Acceptă avertismentul de certificat („Afișează detaliile” → „vizitează acest site”), apoi apasă „Pornește” și permite senzorii, camera și locația.

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

## Tehnologii folosite

| Ce | Pentru ce |
|---|---|
| JavaScript (ES modules), HTML, CSS | tot codul aplicației, fără framework de UI |
| [three.js](https://threejs.org) | randarea 3D: stelele (un singur `Points`), liniile constelațiilor (`LineSegments`), orizontul, planetele (`Sprite`); camera 3D e rotită după senzori |
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | pozițiile Soarelui, Lunii și planetelor, rotația cerului pentru locația și ora curentă |
| [Vite](https://vite.dev) + `@vitejs/plugin-basic-ssl` | server de dezvoltare și build; HTTPS cu certificat self-signed, pentru că telefonul dă acces la cameră și senzori doar pe HTTPS |
| [d3-celestial](https://github.com/ofrohn/d3-celestial) | catalogul de stele (Hipparcos, până la magnitudinea 6), numele stelelor, liniile constelațiilor |
| [api.wheretheiss.at](https://wheretheiss.at/w/developer) | poziția ISS în timp real |
| [geomagnetism](https://github.com/naturalatlas/geomagnetism) (World Magnetic Model 2025) | declinația magnetică pentru locația ta: busola arată nordul magnetic, iar cerul are nevoie de nordul geografic (în România diferența e ≈ 6°) |

API-uri ale browserului, folosite direct, fără biblioteci:

- `navigator.mediaDevices.getUserMedia`: camera din spate, ca fundal video
- `DeviceOrientationEvent` / `deviceorientationabsolute` (Android) / `webkitCompassHeading` (iOS): încotro e îndreptat telefonul; pe iOS permisiunea se cere cu `DeviceOrientationEvent.requestPermission()`
- `navigator.geolocation`: latitudinea și longitudinea utilizatorului
- `fetch`: catalogul local de stele și API-ul ISS

## Resursele de la curs și varianta aleasă

Condiția de pornire: aplicația trebuie să ruleze pe iPhone, iar eu nu am Mac. Orice aplicație nativă pentru iOS (ARKit, Unity, ViroReact) cere build din Xcode, deci Mac. Singura familie din listă care rămâne este **WebAR în browser** (A-Frame / AR.js / awe.js).

Am ales **WebAR „location-based”**, aceeași idee ca modul location-based din AR.js (GPS + busolă + camera), dar implementată direct pe three.js, pe care sunt construite și A-Frame și AR.js.

De ce nu e nevoie de ARKit/ARCore: stelele și planetele sunt practic la infinit. Dacă muți telefonul câțiva metri, cerul nu se schimbă; contează doar **rotația** telefonului (3 grade de libertate), nu poziția lui. Detecția de suprafețe și tracking-ul de mișcare (SLAM) din ARKit/ARCore nu ajută la nimic aici. Senzorii de orientare, GPS-ul și ceasul sunt suficiente.

| Resursă | Ce este | Folosit? | De ce |
|---|---|---|---|
| [A-Frame + AR.js](https://aframe.io/blog/arjs/) | framework WebAR declarativ (scene în HTML), construit peste three.js | Indirect: aceeași bază, three.js | Am folosit three.js direct ca să controlez camera din senzori și să desenez mii de stele ca un singur obiect; în A-Frame ar fi fost oricum cod three.js scris în componente. |
| [AR.js](https://ar-js-org.github.io/AR.js-Docs/) | WebAR cu markere, imagini sau location-based | Principiul location-based | AR.js plasează obiecte la coordonate GPS, la distanță finită. Stelele au coordonate cerești (ascensie dreaptă / declinație) care se rotesc cu ora, așa că a trebuit oricum calculul astronomic și conversia la orizontul local, plus calibrarea busolei diferit pe iOS și Android. |
| [awe.js](https://github.com/awe-media/awe.js) | bibliotecă WebAR mai veche (getUserMedia + senzori + three.js) | Nu | Proiect nemaiîntreținut; am folosit direct aceleași API-uri ale browserului pe care le folosea și el. |
| [Unity AR Foundation](https://docs.unity3d.com/Manual/AROverview.html) | motor de jocuri cu AR nativ peste ARKit/ARCore | Nu | Aplicație nativă: pentru iPhone cere build din Xcode, deci Mac. Pentru o scenă de puncte și linii e și mult prea greu. |
| [Google ARCore](https://developers.google.com/ar) | SDK AR nativ pentru Android (plus WebXR în Chrome) | Nu | Doar Android. WebXR `immersive-ar` nu e suportat de Safari pe iPhone. |
| [Apple ARKit](https://developer.apple.com/augmented-reality/) | SDK AR nativ pentru iOS | Nu | Cere Xcode (Mac) și cont Apple Developer. |
| [ViroReact](https://github.com/ReactVision/viro) | AR în React Native, peste ARKit/ARCore | Nu | Tot aplicație nativă, cu build iOS (Xcode sau build în cloud plus cont Apple Developer pentru instalare pe telefon). |
