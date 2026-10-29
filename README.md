# Mahjong

Wymagany Node.js 20 lub nowszy. Bez instalacji zależności.

```sh
npm start
```

Otwórz http://localhost:5173. Testy: `npm test`.

PWA: `npm run build`, następnie opublikuj zawartość `dist/` na hostingu HTTPS (także w podkatalogu). Podgląd paczki: `npm run preview`. Każdy build otrzymuje wersję cache wyliczoną z plików. Nie ustawiaj długiego cache HTTP dla `sw.js`.

Na tablecie otwórz adres HTTPS. Android/Chrome: menu → „Zainstaluj aplikację”. iPad/Safari: Udostępnij → „Do ekranu początkowego”. Po komunikacie „Gra jest gotowa do działania offline” internet nie jest wymagany. Aktualizację wczytuje przycisk w panelu; resetuje planszę, zachowuje ranking. Wyniki pozostają lokalne dla danej aplikacji i adresu — instalacja na innym urządzeniu ich nie przenosi.

HTTP po adresie IP komputera w sieci lokalnej nie wystarcza do instalacji PWA. `localhost` służy do testów na komputerze.

`src/domain` — reguły, rozwiązywalne rozdania i zegar. `src/storage` — ranking localStorage. `src/ui` — prezentacja. `src/pwa` — instalacja i aktualizacje. `src/main.js` — obsługa zdarzeń.
