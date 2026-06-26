# Integrare SSO ONedu – ContulMeu

Aplicația ContulMeu folosește **SSO ONedu** pentru autentificare: utilizatorii neautentificați sunt redirecționați la serverul SSO, se loghează acolo și revin cu un token, schimbat apoi în JWT și salvat în cookie.

## Configurare

### 1. Înregistrare client în SSO

În proiectul **SSO-onedu** rulezi scriptul care adaugă/actualizează clientul ContulMeu și generează **app token**:

```bash
cd SSO-onedu
node scripts/add-contulmeu-client.js
```

Copiază **App Token** afișat în consolă.

### 2. Variabile de mediu în ContulMeu

Toate cele 4 variabile sunt **necesare**. Fără `AUTH_APP_TOKEN` (server-side), callback-ul SSO eșuează și ești redirecționat înapoi la login.

1. Copiază `contulmeu-onedu/.env.example` ca `contulmeu-onedu/.env.local`.
2. Rulează în SSO `node scripts/add-contulmeu-client.js` – scriptul afișează un bloc gata de lipit în `.env.local`.
3. Sau completează manual în `.env.local`:

```env
AUTH_SERVER_URL=http://localhost:4000
AUTH_APP_TOKEN=<app_token_de_la_script>
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:4000
NEXT_PUBLIC_AUTH_APP_TOKEN=<același_app_token>
```

- **AUTH_APP_TOKEN** / **NEXT_PUBLIC_AUTH_APP_TOKEN**: același token; callback-ul (server) folosește `AUTH_APP_TOKEN`, clientul (redirect la SSO) poate folosi `NEXT_PUBLIC_AUTH_APP_TOKEN`.
- Producție: folosește `https://auth.onedu.ro` și app token-ul generat pentru producție.

### 3. Origin în SSO

Scriptul `add-contulmeu-client.js` setează `origin` după `DEFAULT_APP_URL` sau `http://localhost:5500`. Asigură-te că în SSO-onedu, în `.env`, ai:

- `DEFAULT_APP_URL=http://localhost:5500` (sau URL-ul unde rulează ContulMeu în dev)

Astfel SSO știe că redirect-ul după login este către aplicația ta.

## Flux (token securizat prin POST)

1. Utilizatorul deschide o pagină ContulMeu (fără cookie JWT).
2. **Middleware** redirecționează la `AUTH_SERVER_URL/login?serviceURL=<URL ContulMeu>`.
3. Utilizatorul se loghează pe SSO; SSO răspunde cu `postCallbackUrl` și `ssoToken`, iar pagina de login trimite un **formular POST** către `POST /auth/sso-callback` cu `ssoToken` și `returnUrl` (tokenul **nu** apare în URL).
4. **Route** `POST /auth/sso-callback` primește tokenul, îl schimbă pe server la SSO `/verifytoken`, setează cookie-ul `onedu_jwt` și redirecționează la `returnUrl`.
5. La request-urile următoare, middleware vede cookie-ul și permite accesul.

## Fișiere implicate

- `src/middleware.ts` – redirect către SSO dacă nu există JWT; exclude `/auth`, `/media`, `/_next`, etc.
- `src/app/auth/sso-callback/route.ts` – primește POST cu `ssoToken` și `returnUrl`, face exchange la SSO pe server, setează cookie și redirecționează.
- `src/lib/auth-client.ts` – `getAuthServerUrl`, `getJwtFromCookie`, `redirectToSsoLogin` (pentru link „Loghează-te”); `exchangeSsoToken` rămâne disponibil pentru cazuri speciale.

## Apeluri către SSO (ex. profil)

Pentru request-uri către SSO (ex. `GET /auth/me`) trimite JWT-ul din cookie în header:

```ts
import { getAuthServerUrl, getJwtFromCookie } from "@/lib/auth-client";

const jwt = getJwtFromCookie();
const res = await fetch(`${getAuthServerUrl()}/auth/me`, {
  headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
});
```

## Rute publice

Rutele care încep cu `/auth`, `/media`, `/_next`, `/favicon`, `/images` **nu** sunt protejate de middleware (nu se face redirect către SSO). Poți modifica lista în `src/middleware.ts` (`publicPaths`). Avatarele sunt servite mereu prin `/media/avatar/[userId]` (proxy ContulMeu), nu direct de la SSO.
