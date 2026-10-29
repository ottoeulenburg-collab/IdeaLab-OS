# Gestaltung

## Vereinfachte Arbeitsoberfläche

Die aktuelle Nutzervorgabe reduziert die Navigation auf Übersicht, Aufgaben, Kontakte und Budget. Das Event-Banner, Kennzahlen zu Überfälligkeit/Erledigung, die separate Tagescheckliste und der Schichtplan werden nicht mehr angezeigt. Die Übersicht zeigt offene Aufgaben, ein Sieben-Tage-Deadline-Fenster, alle Aufgaben als nach Priorität sortierte Checkliste und die Budgetkarte. Der Aufgabenbereich bietet dieselbe Checkliste plus einen Monatskalender mit Tagesliste und vorausgefülltem Datum beim Anlegen. Kontakte erhalten Zuständigkeit und interne Ansprechperson. Die CI-Palette bleibt bestehen; das alte Dashboardbild dient ausschließlich als historische Referenz.

## Aktueller CI-Stand

Der ergänzte Reiter „Equipment & Logistik“ übernimmt das bestehende CI-System. Desktop: filterbare Inventartabelle mit direkten Statusaktionen; Handy: beschriftete Karten und fünf Einträge in der unteren Navigation. Detailansicht mit QR-Code, Formular und Etikettenauswahl verwenden die vorhandenen Dialoge. Drucketiketten sind schwarz-weiß, mit ruhiger Zone um jeden QR-Code und eigenem A4-Drucklayout. Der Inventarbereich startet leer, um keine Testdaten in bestehende Arbeitsstände einzufügen.

Die nachträgliche Nutzervorgabe ersetzt die ursprüngliche Palette: Dunkelgrau `#1e1e1e`, Violett `#9e68fa`, Grün `#35ab32`, Weiß `#FFFFFF`. Abgestufte Oberflächen und Textfarben sind ausschließlich daraus gemischt. Das Event-Banner ist dunkel mit violettem Countdown; Hauptaktionen sind violett, Fortschritt und abgeschlossene Aufgaben grün. Das bestehende Layout bleibt erhalten.

Coolvetica ist bevorzugt konfiguriert; die Schriftdatei wurde noch nicht bereitgestellt und ist auf dem Rechner nicht vorhanden. Bis dahin wird ausdrücklich DM Sans als lokale Ersatzschrift verwendet. Einbindung einer später gelieferten regulären Coolvetica-Webfont-Datei erfolgt automatisch aus `src/assets/fonts/`.

Die folgenden Angaben dokumentieren den ursprünglichen Entwurf vor der CI-Anpassung.

Referenz: `dashboard-concept.png`, über das integrierte Image-Gen-Werkzeug erzeugt; 1505 × 1045 Pixel. Eigenständige Umsetzung sämtlicher Bedienelemente in React, keine gerasterte Oberfläche.

## Designsystem

- Weißer, 240 px breiter Navigationsbereich; hellgrauer Seitenhintergrund `#f6f8fa`.
- Text `#1e322e`, sekundärer Text `#65707c`, Linien `#dde3e8`.
- Salbeigrünes Event-Band `#e8f0e1`, Aktionstasten `#557e4e`.
- DM Sans, alternativ Systemschrift. Große, kompakte Überschriften; ruhige 12–15 px Beschriftungen.
- Hauptabstände 12/16/20/24/28/34 px. Paneele 12 px Radius, Tasten 8 px Radius.
- Dünne Outline-SVGs mit 1,7 px Strichstärke, farbige Statusetiketten und Initialen-Avatare.
- Desktop: Event-Band, dreiteilige Aufgabenleiste, Prioritäten/Checkliste, Budget/Schichten.
- Tablet: schmale Navigation, bei Bedarf gestapelte Paneele. Handy: untere Navigation, einspaltiger Inhalt, Tabellen als beschriftete Einträge.
- Dialoge übernehmen Typografie, Farben und Abstände; Tastaturfokus bleibt innerhalb des offenen Dialogs.

## Konzeptbrief

Vollständiger Dashboard-Entwurf für das deutsche „IdeaLab! Event Command Center“ für studentische Event-Organisation. Weißer Sidebar mit textbasierter Marke und Übersicht, Aufgabenboard, Schichtplan, Kontakte, Budget. Hauptüberschrift „Dein Event. Im Blick.“, Unterzeile „Ein guter Plan macht Platz für große Ideen.“, Aktion „Aufgabe erstellen“. Salbeigrünes Event-Band mit „IdeaLab! Community Night“, Termin, Ort, 22-Tage-Countdown und „Event bearbeiten“. Aufgabenübersicht 8 offen, 2 überfällig, 4 erledigt. Darunter drei priorisierte Aufgaben und fünf Event-Tages-Checklistenpunkte; anschließend Budget und nächste Schichten. Kein Bildmaterial, keine Verläufe, kein dekorativer Ballast. Zugehörige Kanban-, Schichtlisten-, Kontakt-/Budgettabellen und Formulare verwenden dasselbe System. Mobil gestapelt. Alle Inhalte und Steuerungen bleiben code-native.

## Bewusste Ergänzungen gegenüber dem Bild

Die nötigen Funktionen bestimmen dynamische Zahlen und Termine. Im Bild enthaltener Beispielname „MK“ wurde durch den tatsächlichen Helfer Max Bauer („MB“) ersetzt. Gesamtplanung, Planungspuffer und offene Planung werden aus den erfassten Beträgen berechnet. Backup-Steuerung, Speicherhinweis, Checklisten-Verwaltung und Budgetnavigation ergänzen die Bedienbarkeit. Fehler-/Leerzustände und alle weiteren Funktionsansichten folgen den oben beschriebenen Komponenten.

## Visueller Abgleich

Vergleich im eingebauten Browser bei nativen 1505 × 1045 Pixeln, anschließend Referenz und Browser-Screenshot mit dem Bildbetrachter geprüft.

| Prüfpunkt           | Referenz und Umsetzung / bewusste Abweichung                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aufbau              | Weißer Sidebar, hellgrauer Inhalt, Event-Band, dreiteilige Kennzahlenleiste, zwei Paneelreihen übernommen.                                          |
| Typografie          | Kompakte dunkle Sans-Serif-Überschriften und abgestufte UI-Texte; DM Sans lokal eingebunden.                                                        |
| Palette             | Salbeigrün, weißes Paneelmodell, dunkle Schrift und dezente Trennlinien übernommen.                                                                 |
| Abstände und Formen | 240-px-Navigation, große Innenabstände, 12-px-Paneelradien, feine Umrandungen.                                                                      |
| Icons und Zustände  | Dünne Outline-SVGs, runde Häkchen, Initialen-Avatare und Prioritätsfarben.                                                                          |
| Sichtbare Texte     | Hauptüberschrift, Unterzeile, Hauptaktion, Navigation und Paneeltitel entsprechen dem Entwurf. Zusätzliche Funktionsaktionen wie oben dokumentiert. |
| Responsive          | Bei 390 × 844 einspaltiger Inhalt, untere Navigation und beschriftete Tabellenzeilen; in allen fünf Ansichten kein horizontaler Überlauf.           |

Im Browser gefundene Probleme behoben: Datumsereignisse übernehmen Werte jetzt zuverlässig; native Bestätigungsfenster durch interne Dialoge ersetzt; eindeutige ARIA-Titel bei verschachtelten Dialogen; Abstand zur Scrollleiste bei Teamaktionen; Datum und Uhrzeit mobil mit sichtbarer Trennung. Die dynamischen Beispieldaten weichen bewusst in Terminen, Personalbesetzung und Budgetplanung vom statischen Konzept ab.
