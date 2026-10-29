# IdeaLab! Event Command Center

Responsive Event-Orga mit React und Vite. Deutsche Oberfläche, leerer Start, kein Login und kein Backend. Daten bleiben ausschließlich im jeweiligen Browser; keine Synchronisierung zwischen Geräten oder Teammitgliedern.

## Deployment

Empfohlen: Node 24 (siehe `.nvmrc`). Im Projektordner `npm ci`, `npm test` und `npm run build` ausführen. Ausschließlich den Inhalt von `dist/` veröffentlichen. `npm run preview` dient zur lokalen Prüfung des Builds, nicht als Produktionsserver. Umgebungsvariablen, API-Schlüssel und Serverfunktionen sind aktuell nicht erforderlich.

- **Netlify:** Projektordner als eigenes Git-Repository importieren. Die enthaltene `netlify.toml` setzt Build-Befehl `npm run build`, Veröffentlichungsordner `dist` und Node 24. Alternativ `dist/` nach einem lokalen Build per manuellem Deploy hochladen.
- **Vercel:** Repository importieren, Framework „Vite“, Build-Befehl `npm run build`, Output `dist`, Node 24 wählen. Falls das gesamte übergeordnete Workspace-Repository importiert wird, den App-Ordner als Root Directory einstellen.
- **GitHub Pages:** Den gebauten Inhalt von `dist/` über einen Pages-Workflow veröffentlichen; in Settings → Pages „GitHub Actions“ auswählen. Die offizielle [Vite-Anleitung](https://vite.dev/guide/static-deploy) enthält einen vollständigen Workflow. Bei einem Workflow im übergeordneten Repository das Arbeitsverzeichnis und den Artefaktpfad auf diesen App-Ordner anpassen.

`vite.config.js` verwendet relative Asset-Pfade (`base: "./"`). Die App verwendet keine Pfadrouten; Equipment-Links liegen im URL-Hash. Damit sind Domains und Unterordner ohne Server-Rewrite nutzbar. Vor einer Veröffentlichung unter einem neuen Domainnamen den bisherigen Datenstand exportieren und auf der neuen Adresse importieren: Browser-Speicher hängt an der jeweiligen Origin. Eine Veröffentlichung wurde noch nicht ausgeführt.

## Leerer Start und Zuständigkeiten

`src/data.js` erzeugt ausschließlich leere Listen und ein Budget von 0 €. Testdaten liegen isoliert unter `tests/fixtures.js` und werden nicht in die App importiert. Es werden keine gespeicherten Aufgaben, Kontakte oder Budgets automatisch gelöscht.

Aufgaben: Team Orga oder Tech wählen; bei Orga ist Otto oder Anton auszuwählen. Ein Teamwechsel verwirft die vorherige Person. Zuständigkeitsfilter und Suche gelten sowohl für Liste als auch Kalender. Unbekannte alte Aufgaben-Zuständigkeiten werden als „Noch nicht zugewiesen“ geführt; der bisherige Text bleibt als `legacyOwner` im Backup und als Hinweis im Formular erhalten. Bereits bekannte Namen Otto/Anton werden zu Orga zugeordnet. Kontakte und Equipment bieten dieselben festen Zuordnungen und erhalten abweichende alte Angaben sichtbar als bisherige Angabe.

Die Datenmigration geschieht zentral in `src/store.js`, ohne den Speicherschlüssel zu ändern. Alte Backups bleiben lesbar. Bei unlesbaren gespeicherten Daten wird eine leere Ansicht mit Fehlermeldung geöffnet; Speichern wird blockiert, damit die vorhandenen Rohdaten nicht überschrieben werden. Die Datenhaltung ist über `useEventStore` von den Ansichten getrennt; ein späteres Backend kann hier angebunden werden, benötigt aber zusätzlich Anmeldung und ein Konzept für gemeinsame Änderungen.

## Starten

Voraussetzung: eine aktuelle Node.js-Version (Node 22.12+ oder 24+).

```sh
cd "/Users/ottoeulenburg/Documents/Codex/2026-10-28/hi-chat-ich-habe-jetzt-das/outputs/idealab-event-command-center"
npm install
npm run dev -- --port 5173 --strictPort
```

Im Browser `http://127.0.0.1:5173/` öffnen. Solange der bereits gestartete Server läuft, genügt das Öffnen dieser Adresse. Im Terminal beendet Strg+C den Server.

```sh
npm run build     # Produktionsdateien nach dist/
npm run preview   # Produktionsversion lokal ansehen
npm test          # Tests für Termine, Budget, Backups, Inventar und QR-Codes
```

## Was funktioniert?

- Übersicht: offene Aufgaben, separat die innerhalb der nächsten sieben Tage fälligen Aufgaben, eine gemeinsame Aufgabencheckliste nach Priorität und die Budgetübersicht. Abhaken aktualisiert alle Ansichten.
- Aufgaben: umschaltbare Listen- und Monatskalenderansicht. Suche und Filter für Bereich, Priorität, Status und Fälligkeit gelten in beiden Ansichten. Aufgaben anlegen, bearbeiten und löschen. Über das Plus an einem Kalendertag ist das Fälligkeitsdatum bereits vorausgewählt; auf dem Handy einen Tag auswählen und die Aktion in der Tagesliste verwenden.
- Kontakte: Name, Rolle, Organisation, Telefon, E-Mail und Notizen sowie „Zuständigkeit“ und „Intern zuständig“ für die Person aus eurem Team, die im Austausch steht. Suche berücksichtigt beide neuen Felder; zusätzlich nach Rolle oder interner Ansprechperson filtern. Vollständige Detailansicht, Bearbeiten und Löschen; Telefonnummern und E-Mails sind anklickbar.
- Budget: Gesamtbudget ändern; Budgetposten mit geplanten und tatsächlichen Beträgen anlegen, bearbeiten und löschen. Automatische Gesamtsummen, Abweichungen, Restbudget und Überschreitungswarnung.
- Equipment & Logistik: Inventar für Technik, Möbel, Schilder, Merchandise und Sonstiges anlegen, bearbeiten und löschen. Pro Eintrag: eindeutige Inventarnummer, Menge/Einheit, Lagerort, Liefertermin mit Uhrzeit, Zuständigkeit, Logistikstatus und Notizen. Suche sowie Kategorie-/Statusfilter; überschrittene Liefertermine werden markiert. Status direkt in der Liste ändern.
- QR-Codes: Eintrag öffnen und einen Code als SVG herunterladen oder Etiketten für einzelne bzw. gefilterte Einträge vorbereiten. Im Etikettendialog auswählen und über „Drucken / als PDF speichern“ ausgeben.
- Daten exportieren / Backup laden: JSON-Backup herunterladen und später wiederherstellen. Ein Import ersetzt nach Bestätigung den aktuellen Stand; ungültige Dateien werden abgewiesen.

„Bald fällig“ umfasst offene und in Arbeit befindliche Aufgaben von heute bis einschließlich sieben Tage in die Zukunft. Bereits überfällige Aufgaben bleiben in der Checkliste sichtbar, werden aber nicht nochmals als bald fällig gezählt. Die Gesamtliste enthält auch abgehakte Aufgaben; Hoch steht vor Mittel und Niedrig, innerhalb derselben Priorität stehen offene Aufgaben vor erledigten. Neue Arbeitsstände enthalten keine Beispieldatensätze.

Event-Banner, Tagescheckliste und Schichtplan sind aus der Oberfläche entfernt. Vorhandene Einträge und ältere Backup-Dateien bleiben kompatibel; frühere Event- und Schichtdaten werden beim Export weiterhin erhalten. Bei alten Kontakten sind die zwei neuen Felder zunächst leer und können ergänzt werden.

Das Inventar startet leer und wird auch bei älteren Backups automatisch ergänzt. Bestehende Aufgaben, Kontakte und Budgetdaten bleiben erhalten.

## QR-Codes verwenden

Standardmäßig enthält ein QR-Code die Inventarinfos als lesbaren Text. Das funktioniert beim Scannen ohne Zugriff auf die App. Er enthält den Stand beim Erstellen; nach Änderungen an Lagerort, Termin oder Zuständigkeit das Etikett neu drucken.

Alternativ „Direktlink zum Eintrag“ wählen. Dieser öffnet den Datensatz nur, wenn er im öffnenden Browser vorhanden ist. Die App synchronisiert keine Daten zwischen Geräten. Ein Smartphone erreicht deinen Rechner nicht über `127.0.0.1`; für geräteübergreifende Live-Links wäre später eine gemeinsam erreichbare App mit zentraler Speicherung nötig. QR-Codes werden vollständig lokal erzeugt.

## Speicherung

Die App speichert erfolgreiche Änderungen unter `idealab-command-center:v1` im `localStorage` dieses Browsers. Beim Neuladen bleiben sie erhalten. Es gibt keine gemeinsame Datenbank und keine Synchronisierung zwischen Personen, Geräten oder Browsern. Regelmäßig „Daten exportieren“ verwenden. Privates Surfen, Löschen von Browserdaten oder ein Wechsel der Adresse/des Ports kann dazu führen, dass dein bisheriger Stand nicht mehr verfügbar ist. Backups lassen sich über „Backup laden“ wiederherstellen.

Die App ist nach der Installation vollständig lokal nutzbar. Auch die Schriftdateien sind im Projekt enthalten. Nutzerinhalte werden nicht an einen Server gesendet.

## IdeaLab!-CI

Die Oberfläche verwendet `#1e1e1e`, `#9e68fa`, `#35ab32` und `#FFFFFF`. Dezente Hintergründe und Linien werden aus diesen Farben gemischt. Violett kennzeichnet Hauptaktionen und Prioritäten, Grün erledigte Aufgaben und Fortschritt, Dunkelgrau Text.

Coolvetica ist als bevorzugte Schrift konfiguriert. Die eigentliche Coolvetica-Datei liegt noch nicht vor; aktuell wird daher die lokal gebündelte DM Sans als Ersatz verwendet. Eine vorhandene lokale Coolvetica-Installation wird automatisch erkannt. Sobald eine für Web-Einbettung freigegebene reguläre Coolvetica-Datei unter `src/assets/fonts/` liegt, bindet die App sie automatisch ein. Details: `src/assets/fonts/README.md`.

## Wichtige Dateien

- `src/App.jsx`: App-Rahmen, Navigation und Backup-Import/-Export.
- `src/features/`: Übersicht, Aufgaben, Kontakte, Budget und Equipment als getrennte Komponenten. `Shifts.jsx` ist nur noch ungenutzter Altbestand.
- `src/features/Equipment.jsx`, `src/features/equipment/`: Inventarliste, Formular, Detailansicht und Etikettenauswahl.
- `src/equipment.js`, `src/equipment-qr.js`, `src/components/EquipmentQr.jsx`: Inventarprüfung, Liefertermine, Direktlinks und lokal erzeugte QR-Codes.
- `src/components/TaskList.jsx`, `TaskCalendar.jsx`, `TaskForm.jsx`: gemeinsame Checkliste, Kalender und Aufgabenformular.
- `src/components/UI.jsx`: Bedienelemente und zugängliche Dialoge.
- `src/store.js`: Browser-Speicherung, Datenprüfung, zentrale Änderungen.
- `src/data.js`: leere Startdaten.
- `src/assignment.js`, `src/components/AssignmentFields.jsx`: zentrale Zuständigkeitslogik und Auswahlfelder.
- `vite.config.js`, `netlify.toml`, `.nvmrc`: Deployment-Konfiguration.
- `src/utils.js`: Termine, Budgetarithmetik, Priorisierung, Schichtkonflikte.
- `src/styles.css`, `src/planning.css`, `src/equipment.css`: CI-Designsystem, responsive Ansichten und Drucketiketten.
- `tests/logic.test.js`, `tests/equipment.test.js`: fachliche Grenzfälle, Backup-Kompatibilität und unabhängiges Decodieren der erzeugten QR-SVGs.
- `design/dashboard-concept.png`: visueller Entwurf des Dashboards.

Ein Löschen wird im Dialog bestätigt. Die Daten können über ein zuvor exportiertes Backup wiederhergestellt werden.

## Durchgeführte Prüfung

Produktions-Build und 18 fachliche Tests erfolgreich. Die Tests decken Termine, Priorisierung, Kalender, Budget, alte Kontakte und Backups sowie Inventarvalidierung, eindeutige Inventarnummern, Lieferwarnungen und Direktlinks ab. Die QR-SVGs werden mit dem unabhängigen Decoder jsQR auf exakten Inhalt geprüft, einschließlich Umlauten.

Im eingebauten Browser geprüft: Aufgaben- und Kontaktabläufe sowie Equipment-Anlage, Bearbeiten, Statuswechsel, Filter, doppelte Inventarnummern, Speicherung und Direktlink nach Neuladen, SVG-Download, Link-Kopieren und einzelne/gesammelte Etikettenauswahl. Responsive Prüfung bei 390 × 844 und 1440 × 1000 Pixeln. Das Drucklayout wurde mit emuliertem Druckmedium geprüft; ein physischer Drucker wurde nicht getestet. Testeinträge anschließend entfernt. Andere Browser-Engines und gleichzeitiges Bearbeiten in mehreren Tabs wurden nicht getestet.
