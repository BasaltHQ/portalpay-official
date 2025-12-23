# Open Source VC Outreach Automation (OSS Edition)

This repository includes `vcrun_oss.py`, a configurable, first‑person outreach automation script that:
- Loads contacts from a CSV
- Generates personalized outreach emails using Azure OpenAI (JSON output: subject/body)
- Sends via Gmail API (OAuth) with rate limiting and persistent CSV logging
- Optionally records opens via a Google Apps Script tracking pixel

No hard‑coded secrets. All values are provided by the user via `.env` and/or CLI flags.

## Quickstart

1. Copy `.env.example` to `.env` and fill in your values (see Config below).  
2. Prepare your contacts CSV (default `contacts.csv`) with columns:
   - `email` (required), `name`, `firm`, `title`, `type`, `location`
3. Obtain `gmail_credentials.json` from Google Cloud Console (OAuth Client “Desktop app”).  
4. Run a dry preview to validate generation:
   ```
   python vcrun_oss.py --dry-run --debug
   ```
5. Send for real:
   ```
   python vcrun_oss.py
   ```

## Configuration

You can configure via:
- `.env` (load order respects existing environment variables)
- CLI flags (override `.env` values)

See `.env.example` for a full template.

Key variables:
- Azure OpenAI (REQUIRED)
  - `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`
- Data paths
  - `CONTACTS_FILE` (default `contacts.csv`)
  - `SENT_LOG_PATH` (default `sent_emails_log.csv` in cwd)
- Gmail OAuth
  - `GMAIL_CREDENTIALS_FILE`, `GMAIL_TOKEN_FILE`, `GMAIL_SCOPES` (default `https://www.googleapis.com/auth/gmail.send`)
- Email limits
  - `DAILY_LIMIT`, `EMAILS_PER_HOUR`, `SECONDS_BETWEEN_EMAILS`
- Optional links (displayed in a simple “Resources” block)
  - `INVESTOR_PORTAL_LINK`, `DATA_ROOM_LINK`, `PORTALPAY_LINK`, `CALENDAR_LINK`
- Optional tracking pixel
  - `TRACKING_PIXEL_URL` (Google Apps Script Web App “exec” URL)
- Brand / compliance
  - `COMPANY_NAME`, `COMPANY_ADDRESS`, `COMPANY_CITY_STATE_ZIP`
- Persona / founder details
  - `FOUNDER_NAME`, `FOUNDER_CITY`, `FOUNDER_STATE`

CLI overrides:
- `--setup` interactive prompt for critical fields
- `--contacts <path>` override contacts file path
- `--log-file <path>` override CSV log path
- `--dry-run` generate and assemble email but do NOT send or log
- `--debug` verbose logs
- `--report` show log summary and exit

## Contacts CSV Format

Expected columns:
```
email,name,firm,title,type,location
jane@fund.com,Jane Doe,Fund Capital,Partner,Seed/Series A,NYC
...
```
- `email` is required; other columns may be blank.

Duplicate prevention:
- The script appends real sends to `sent_emails_log.csv` and skips any recipients already logged on subsequent runs.

## Persona and Prompt Behavior

The script writes in first person as the founder defined by:
- `FOUNDER_NAME`, `FOUNDER_CITY`, `FOUNDER_STATE`

It enforces:
- JSON-only generation (`{"subject": "...", "body": "..."}`)
- Plain text body; no HTML/signatures/resources/disclaimers from the model
- Narrative, insight-driven style; natural prose (no section headings)
- Personalized hooks tied to recipient thesis/portfolio when research is available
- CTA mentions the founder’s location and remote availability

You can change `FOUNDER_*` values in `.env` to adopt a different persona.

## Gmail OAuth

- Place `gmail_credentials.json` in the repo root (or set another path via env/CLI).
- On first run (non `--dry-run`), a browser opens to complete OAuth.
- A token is saved to `gmail_token.pickle` (JSON preferred, with pickle fallback).

## Optional: Open Tracking Pixel (Google Apps Script)

1. Create a Google Sheet; note its ID (from the Sheet URL).
2. In that sheet: Extensions → Apps Script → New project.
3. Paste the following script and deploy as a Web App:
   - Execute as: Me
   - Who has access: Anyone

```javascript
function doGet(e) {
  const SHEET_ID = 'PASTE_SHEET_ID';
  const SHEET_NAME = 'opens';

  const p = (e && e.parameter) ? e.parameter : {};
  const utm = p.utm_id || p.u || '';
  const email = p.email || p.e || '';
  const name = p.name || '';
  const firm = p.firm || '';
  const subject = p.subject || '';
  const campaign = p.campaign || 'vcoutreach';
  const ua = (e && e.headers && e.headers['User-Agent']) ? e.headers['User-Agent'] : '';

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp','email','utm_id','name','firm','subject','campaign','userAgent']);
  }

  sheet.appendRow([new Date(), email, utm, name, firm, subject, campaign, ua]);

  // Return 1x1 transparent PNG
  const pixelB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgIB/ahw0RAAAAAASUVORK5CYII=';
  const bytes = Utilities.base64Decode(pixelB64);
  return ContentService.createBinaryOutput(bytes)
    .setMimeType(ContentService.MimeType.PNG);
}
```

4. Copy the “exec” URL and set `TRACKING_PIXEL_URL` in `.env`.

The script sends:
- `utm_id` (first 12 chars of SHA-256(email)), `email`
- Optional: `name`, `firm`, `subject`, `campaign`, `r` (cache buster)

Note: Some email clients proxy images. A cache-buster param is included but load behavior may vary.

## Logging and Reports

On first real send, `sent_emails_log.csv` is created (or on startup if missing).
- Append rows: `email,name,firm,timestamp,status,message_id`
- Skip recipients present in the log on subsequent runs.

View report:
```
python vcrun_oss.py --report
```

## Troubleshooting

- Missing Azure config: ensure `AZURE_OPENAI_*` are set (endpoint, key, deployment).
- Gmail OAuth fails: verify `gmail_credentials.json` is present and valid.
- Contacts not loading: confirm path and required `email` column. Use `--contacts <path>`.
- Pixel doesn’t log: verify Web App access = “Anyone” and the URL is the “exec” URL.
- Model returns HTML or extra sections: the system/user prompt blocks this; ensure you’re running `vcrun_oss.py`.

## License

You may choose a license appropriate for your repo (e.g., MIT, Apache-2.0). This file assumes MIT.  
Add a `LICENSE` file in your project root with your chosen license text.

## Commands Summary

- Dry preview:
  ```
  python vcrun_oss.py --dry-run --debug
  ```
- Real send:
  ```
  python vcrun_oss.py
  ```
- Report:
  ```
  python vcrun_oss.py --report
  ```
- Interactive setup:
  ```
  python vcrun_oss.py --setup
