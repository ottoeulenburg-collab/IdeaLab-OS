# IdeaLab! Event Command Center

React/Vite-Team-App mit Supabase Auth, PostgreSQL und Realtime. Aufgaben mit Liste/Kalender, Kontakte, Budget und Equipment/QR-Codes bleiben erhalten. Gemeinsame Daten werden nach der Anmeldung aus der Cloud geladen. Neue Arbeitsbereiche enthalten keine Beispieldaten.

## Lokal entwickeln

Node 24 verwenden, Befehle im Ordner `idealab-event-command-center` ausführen:

```sh
npm ci
cp .env.example .env.local
# Die zwei öffentlichen Supabase-Werte in .env.local eintragen
npm run dev
```

`http://127.0.0.1:5173/` öffnen. Nach Änderungen an Umgebungsvariablen den Dev-Server neu starten.

```sh
npm test
npm run test:e2e
npm run build
npm run preview
```

`test:e2e` startet einen eigenen Dev-Server mit Testkonfiguration und verwendet lokal installiertes Google Chrome. Browser-Tests simulieren die Supabase-Schnittstellen. SQL-Tests verwenden PostgreSQL über PGlite mit Rollen, RLS und RPCs. Auth-E-Mails und logische Replikation müssen nach Einrichtung im echten Supabase-Projekt geprüft werden.

## Supabase einrichten

1. Auf [Supabase](https://supabase.com/dashboard) ein Projekt anlegen, Region wählen und Datenbankpasswort sicher aufbewahren.
2. Im SQL Editor den vollständigen Inhalt von `supabase/migrations/202610290001_team_workspace.sql` einmal ausführen. Alternativ mit der Supabase CLI ausrollen. Die Migration erzeugt einen leeren Arbeitsbereich, Mitgliedschaften und vier Datentabellen samt RLS, RPCs und Realtime. Keine zusätzlichen öffentlichen Policies oder Schreibrechte einrichten.
3. Unter Authentication → URL Configuration die produktive Vercel-Adresse als **Site URL** eintragen. Unter **Redirect URLs** die genaue Adresse mit abschließendem `/` sowie für lokale Entwicklung `http://127.0.0.1:5173/` erlauben. Bei Unterpfaden den vollständigen Pfad eintragen. Nur eigene vertrauenswürdige Domains freigeben.
4. Unter Authentication → Providers → Email den Provider aktivieren. Die App verwendet E-Mail/Passwort; Magic Links und Einladungs-E-Mails sind dafür nicht erforderlich.
6. Unter Project Settings → API den Projekt-URL und **öffentlichen anon-Key** kopieren und in `.env.local` eintragen:

```dotenv
VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
VITE_SUPABASE_ANON_KEY=DEIN_OEFFENTLICHER_ANON_KEY
```

Keine Service-Role-, Secret- oder Datenbank-Schlüssel im Frontend oder Git speichern. Vite baut die zwei öffentlichen Werte ins Browser-Bundle ein; Zugriffsschutz liegt in Auth, Mitgliedschaften und RLS. `.env*` ist bis auf `.env.example` ignoriert. Ohne Konfiguration erscheint eine Einrichtungsmeldung, ohne Login werden keine Teamdaten geladen.

## Gemeinsamen Admin-Zugang anlegen

Die Login-Maske verwendet den Benutzernamen `admin`. Supabase verlangt intern trotzdem eine E-Mail-Adresse. Lege daher in Supabase unter Authentication → Users → **Add user** genau diesen Zugang an:

| Feld | Wert |
| --- | --- |
| E-Mail | `admin@idealab.local` |
| Passwort | `orgatechfickt` |
| Auto Confirm User | aktivieren |

Danach im SQL Editor diese Mitgliedschaft ausführen:

```sql
insert into public.event_members(user_id, workspace_id)
select id, '11111111-1111-4111-8111-111111111111'::uuid
from auth.users where lower(email) = lower('admin@idealab.local')
on conflict(user_id) do nothing;
```

Danach können alle Teammitglieder denselben Vercel-Link und diesen Zugang nutzen. Für echte individuelle Teamkonten sollte später auf eigene E-Mail-Konten und Rollen umgestellt werden.

Erst `event_members` schaltet den Arbeitsbereich frei. Alle Mitglieder können gemeinsame Inhalte bearbeiten. Zugriff für ein späteres individuelles Konto entziehen:

```sql
delete from public.event_members
where user_id in (select id from auth.users where lower(email)=lower('TEAMMITGLIED@BEISPIEL.DE'));
```

Die Datenbank verweigert weitere Zugriffe sofort. Die App überprüft den Zugriff spätestens beim regelmäßigen Abgleich (15 Sekunden) und entfernt nicht mehr lesbare Teamdaten aus der Ansicht.

## SQL-Migration im Supabase-Dashboard

1. Öffne dein Supabase-Projekt und wähle links **SQL Editor**.
2. Klicke **New query**.
3. Öffne im Repository die Datei `supabase/migrations/202610290001_team_workspace.sql`, kopiere ihren gesamten Inhalt hinein und klicke **Run**.
4. Warte auf die Erfolgsmeldung. Danach führe direkt darunter den SQL-Block aus dem Abschnitt „Gemeinsamen Admin-Zugang anlegen“ aus.

Die Migration kann nur einmal auf einem neuen Projekt ausgeführt werden. Falls sie wegen bereits vorhandener Tabellen fehlschlägt, nicht erneut kopieren, sondern zuerst die Fehlermeldung prüfen.

## Vercel veröffentlichen

1. Änderungen prüfen, committen und zu GitHub pushen. Das Repository enthält den Unterordner `idealab-event-command-center`.
2. In Vercel das bestehende Projekt öffnen. **Root Directory:** `idealab-event-command-center`, Framework: Vite, Node: 24, Build Command: `npm run build`, Output Directory: `dist`.
3. Unter Settings → Environment Variables `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` für benötigte Umgebungen eintragen. Für Preview-Deployments müssen deren Redirect-Adressen ausdrücklich in Supabase erlaubt sein. Für Entwicklung vorzugsweise ein getrenntes Supabase-Projekt verwenden.
4. Neu deployen. Änderungen an Vite-Variablen erfordern einen neuen Build. `vite preview` ist nur zur lokalen Kontrolle bestimmt.
5. Mit zwei Browserfenstern prüfen: Aufgabe anlegen, im zweiten Fenster sehen und abhaken. Abmelden und im privaten Fenster prüfen, dass keine Teamdaten angezeigt werden.

Ein Push allein richtet Supabase nicht ein. Vor diesen Schritten zeigt das Deployment die Einrichtungsmeldung.

## Lokale Daten übernehmen und Backups

Die bisherigen Browserdaten unter `idealab-command-center:v1` werden nicht verändert oder gelöscht. Auf derselben Domain im bisherigen Browser anmelden. Gültige lokale Daten lösen das Angebot „Lokales Backup sichern“ und „Lokale Daten übernehmen“ aus. Vorher ein Backup herunterladen. Die Übernahme funktioniert nur im unbenutzten Arbeitsbereich (Revision 0), atomar und mit ausdrücklicher Bestätigung. IDs, Zuständigkeiten und Altbestand bleiben erhalten.

Liegt der alte Stand auf einer anderen Domain oder localhost, dort vor dem Wechsel ein JSON-Backup exportieren. Im neuen Arbeitsbereich über „Backup laden“ nach Prüfung importieren. Ein Import ersetzt nach Bestätigung den **gemeinsamen Stand für alle Teammitglieder** atomar. Regelmäßig Backups sichern. Ungültige lokale Daten werden nicht importiert oder überschrieben und können über die alte App bzw. Browserwerkzeuge gesichert werden.

## Synchronisierung und Konflikte

Die Sammlungen liegen in eigenen Tabellen mit dem bestehenden JSON-Datenmodell pro Eintrag. Eventbudget und alter Checklisten-/Schichtbestand liegen in Workspace-Metadaten. Workspace, Aufgaben-Status/Fälligkeit und Equipment-Status sind indiziert; Inventarnummern sind pro Workspace eindeutig.

Schreibvorgänge laufen über einen RPC mit Mitgliedschaftsprüfung, Transaktion und Revisionsvergleich. Gleichzeitige Änderungen führen zu einer Meldung und laden den aktuellen Stand. Offene Formulare prüfen zusätzlich, ob ihr Eintrag inzwischen geändert oder gelöscht wurde. Dann das Formular schließen, den aktuellen Eintrag erneut öffnen und die Änderung prüfen.

Jeder Schreibvorgang erhöht die Workspace-Revision. Realtime meldet dies an verbundene Clients, die einen konsistenten Snapshot abrufen. Zusätzlich erfolgt alle 15 Sekunden ein Abgleich. Offline sind keine Änderungen möglich; es gibt keine Offline-Warteschlange. Fehlgeschlagene Formulare bleiben offen. Der Status zeigt Live-Verbindung oder regelmäßigen Abgleich. Teamdaten werden nicht als neuer lokaler Cache gespeichert; Supabase speichert die Anmeldesitzung im Browser. Abmelden entfernt die sichtbaren Teamdaten.

## Design und wichtige Dateien

IdeaLab!-Farben: `#1e1e1e`, `#9e68fa`, `#35ab32`, `#FFFFFF`. Coolvetica bleibt bevorzugt konfiguriert, DM Sans ist die gebündelte Ersatzschrift. Eine lizenzierte Coolvetica-Datei kann gemäß `src/assets/fonts/README.md` ergänzt werden.

- `src/components/AuthGate.jsx`, `src/supabase.js`: Login und Client-Konfiguration.
- `src/cloud-store.js`, `src/cloud-data.js`: Store, Konflikte, Realtime, lokale Übernahme.
- `src/store.js`, `src/assignment.js`: Backup-Validierung und Zuständigkeitsmigration.
- `src/App.jsx`, `src/features/`, `src/components/`: Oberfläche und Formulare.
- `supabase/migrations/202610290001_team_workspace.sql`: Tabellen, RLS, RPCs, Realtime.
- `tests/cloud.test.js`: Rechte, Konflikte, atomare Übernahme und alte IDs.
- `tests/e2e/`: Browserabläufe mit simuliertem Supabase-Dienst.

Equipment-QR-Codes werden lokal erzeugt. Direktlinks öffnen den gemeinsamen Datensatz nach Anmeldung; Text-QR-Codes enthalten den Stand zum Druckzeitpunkt.

Offizielle Grundlagen: [E-Mail/Passwort-Login](https://supabase.com/docs/guides/auth/passwords), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes).
