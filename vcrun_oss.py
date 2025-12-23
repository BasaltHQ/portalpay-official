#!/usr/bin/env python3
"""
Open Source VC Outreach Automation (OSS Edition)
- Loads contacts from a simple CSV file
- Generates personalized emails (first-person) using Azure OpenAI
- Sends via Gmail API with rate limiting and progress tracking
- Optional tracking pixel that appends metadata to a Google Sheet

This OSS version is configurable via environment variables, a .env file, or CLI flags.
No hard-coded secrets are included. Users provide their own values.

Quickstart (see README_OUTREACH_OPEN_SOURCE.md for full details):
1) Create a .env using .env.example as a template (or run: python vcrun_oss.py --setup)
2) Place contacts.csv in the current directory with columns: email,name,firm,title,type,location
3) Run a dry preview: python vcrun_oss.py --dry-run --debug
4) Send for real: python vcrun_oss.py

Note:
- Gmail OAuth requires gmail_credentials.json (download from Google Cloud Console).
- Tracking pixel requires a deployed Google Apps Script Web App (optional).
"""

import os
import sys
import time
import csv
import json
import base64
import argparse
import hashlib
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, List

import pandas as pd
import requests
from bs4 import BeautifulSoup
from openai import AzureOpenAI
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ======================================================================
# ENV LOADING (minimal .env parser, no external deps)
# ======================================================================

def load_env_file(dotenv_path: str = ".env") -> None:
    p = Path(dotenv_path)
    if not p.exists():
        return
    try:
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"Warning: Could not parse {dotenv_path}: {e}")

# Load .env early
load_env_file()

# ======================================================================
# CONFIG (read from env, allow CLI override)
# ======================================================================

def get_cfg() -> Dict[str, str]:
    return {
        # Azure OpenAI
        "AZURE_OPENAI_ENDPOINT": os.getenv("AZURE_OPENAI_ENDPOINT", "").strip(),
        "AZURE_OPENAI_API_KEY": os.getenv("AZURE_OPENAI_API_KEY", "").strip(),
        "AZURE_OPENAI_DEPLOYMENT": os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip(),
        "AZURE_OPENAI_API_VERSION": os.getenv("AZURE_OPENAI_API_VERSION", "2024-04-01-preview").strip(),

        # Paths
        "CONTACTS_FILE": os.getenv("CONTACTS_FILE", "contacts.csv").strip(),
        "LOG_FILE": os.getenv("SENT_LOG_PATH", "sent_emails_log.csv").strip(),  # OSS default: cwd CSV
        "GMAIL_CREDENTIALS_FILE": os.getenv("GMAIL_CREDENTIALS_FILE", "gmail_credentials.json").strip(),
        "GMAIL_TOKEN_FILE": os.getenv("GMAIL_TOKEN_FILE", "gmail_token.pickle").strip(),

        # Gmail scopes
        "GMAIL_SCOPES": os.getenv("GMAIL_SCOPES", "https://www.googleapis.com/auth/gmail.send").strip(),

        # Email settings
        "DAILY_LIMIT": os.getenv("DAILY_LIMIT", "200").strip(),
        "EMAILS_PER_HOUR": os.getenv("EMAILS_PER_HOUR", "50").strip(),
        "SECONDS_BETWEEN_EMAILS": os.getenv("SECONDS_BETWEEN_EMAILS", "72").strip(),
        "TEST_EMAIL": os.getenv("TEST_EMAIL", "your-test@example.com").strip(),

        # Links (optional)
        "INVESTOR_PORTAL_LINK": os.getenv("INVESTOR_PORTAL_LINK", "").strip(),
        "DATA_ROOM_LINK": os.getenv("DATA_ROOM_LINK", "").strip(),
        "PORTALPAY_LINK": os.getenv("PORTALPAY_LINK", "").strip(),
        "CALENDAR_LINK": os.getenv("CALENDAR_LINK", "").strip(),

        # Tracking pixel (optional)
        "TRACKING_PIXEL_URL": os.getenv("TRACKING_PIXEL_URL", "").strip(),

        # Brand / compliance
        "COMPANY_NAME": os.getenv("COMPANY_NAME", "Your Company LLC").strip(),
        "COMPANY_ADDRESS": os.getenv("COMPANY_ADDRESS", "123 Main St").strip(),
        "COMPANY_CITY_STATE_ZIP": os.getenv("COMPANY_CITY_STATE_ZIP", "City, ST 00000").strip(),

        # Persona fields (override to change founder name/location)
        "FOUNDER_NAME": os.getenv("FOUNDER_NAME", "Krishna Patel").strip(),
        "FOUNDER_CITY": os.getenv("FOUNDER_CITY", "Santa Fe").strip(),
        "FOUNDER_STATE": os.getenv("FOUNDER_STATE", "New Mexico").strip(),
    }

def prompt_missing(cfg: Dict[str, str]) -> Dict[str, str]:
    """Interactive setup to fill critical missing fields."""
    critical = [
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_DEPLOYMENT",
        "CONTACTS_FILE",
        "GMAIL_CREDENTIALS_FILE",
    ]
    updated = dict(cfg)
    print("Interactive setup (press Enter to keep current value):")
    for key in critical:
        cur = updated.get(key, "")
        if not cur:
            val = input(f"Enter {key}: ").strip()
            updated[key] = val
        else:
            val = input(f"{key} [{cur}]: ").strip()
            if val:
                updated[key] = val
    return updated

# ======================================================================
# GMAIL API
# ======================================================================

def get_gmail_service(cfg: Dict[str, str]):
    creds = None
    token_file = Path(cfg["GMAIL_TOKEN_FILE"])
    credentials_file = Path(cfg["GMAIL_CREDENTIALS_FILE"])
    scopes = [cfg["GMAIL_SCOPES"]]

    if token_file.exists():
        try:
            with token_file.open("rb") as token:
                creds = Credentials.from_authorized_user_info(json.loads(token.read()))
        except Exception:
            # Fallback to pickle for backwards compatibility
            try:
                import pickle
                with token_file.open("rb") as token:
                    creds = pickle.load(token)
            except Exception:
                creds = None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not credentials_file.exists():
                raise FileNotFoundError(f"Missing Gmail credentials: {credentials_file}")
            flow = InstalledAppFlow.from_client_secrets_file(str(credentials_file), scopes)
            creds = flow.run_local_server(port=0)

        # Save credentials (JSON)
        try:
            token_file.write_text(creds.to_json(), encoding="utf-8")
        except Exception:
            # Fallback to pickle
            import pickle
            with token_file.open("wb") as token:
                pickle.dump(creds, token)

    return build("gmail", "v1", credentials=creds)

# ======================================================================
# CONTACTS + LOG
# ======================================================================

def load_contacts_csv(path: str) -> pd.DataFrame:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Contacts file not found: {p}")

    df = pd.read_csv(p)
    # Normalize expected columns
    for col in ["email", "name", "firm", "title", "type", "location"]:
        if col not in df.columns:
            df[col] = ""
    df["email"] = df["email"].str.lower().str.strip()
    # Filter invalid
    df = df[df["email"].notna() & (df["email"] != "")]
    df = df.drop_duplicates(subset=["email"], keep="first")
    return df

def ensure_log_exists(log_path: Path) -> None:
    if not log_path.exists():
        log_path.parent.mkdir(parents=True, exist_ok=True)
        pd.DataFrame(columns=["email","name","firm","timestamp","status","message_id"]).to_csv(log_path, index=False)

def load_sent_log(log_path: Path) -> set:
    if log_path.exists():
        try:
            df = pd.read_csv(log_path)
            return set(df["email"].str.lower().str.strip())
        except Exception:
            return set()
    return set()

def append_sent_log(log_path: Path, email: str, name: str, firm: str, message_id: str = "") -> None:
    ensure_log_exists(log_path)
    entry = pd.DataFrame([{
        "email": email,
        "name": name,
        "firm": firm,
        "timestamp": datetime.now().isoformat(),
        "status": "sent",
        "message_id": message_id or ""
    }])
    entry.to_csv(log_path, mode="a", header=False, index=False)

# ======================================================================
# SCRAPING (optional)
# ======================================================================

def scrape_website_info(url: str, debug: bool=False) -> Optional[str]:
    try:
        if debug:
            print(f"  DEBUG: Scraping website: {url}")
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, "html.parser")
            for t in soup(["script","style","nav","footer","header"]):
                t.decompose()
            info_parts: List[str] = []
            meta_desc = soup.find("meta", attrs={"name":"description"})
            if meta_desc and meta_desc.get("content"):
                info_parts.append(meta_desc.get("content"))
            og_desc = soup.find("meta", property="og:description")
            if og_desc and og_desc.get("content"):
                desc = og_desc.get("content")
                if desc not in info_parts:
                    info_parts.append(desc)
            # First meaningful paragraph
            if not info_parts:
                for p in soup.find_all("p")[:5]:
                    text = p.get_text(strip=True)
                    if len(text) > 100 and "cookie" not in text.lower():
                        info_parts.append(text)
                        break
            if info_parts:
                combined = " ".join(info_parts[:2])
                return combined[:500]
        return None
    except Exception as e:
        if debug:
            print(f"  DEBUG: Scrape error: {e}")
        return None

def lookup_company_info(email_domain: str, firm_name: str, debug: bool=False) -> str:
    domain = email_domain
    company_name = domain.split(".")[0] if domain else ""
    query = firm_name or f"{company_name} venture capital"
    if debug:
        print(f"  DEBUG: Search query: {query}")
    try:
        # Try direct website scrape
        for protocol in ["https","http"]:
            website_url = f"{protocol}://{domain}"
            info = scrape_website_info(website_url, debug=debug)
            if info:
                return info
        for protocol in ["https","http"]:
            website_url = f"{protocol}://www.{domain}"
            info = scrape_website_info(website_url, debug=debug)
            if info:
                return info
    except Exception as e:
        if debug:
            print(f"  DEBUG: Lookup error: {e}")
    return f"Venture capital firm at {domain}"

# ======================================================================
# EMAIL GENERATION (Azure OpenAI)
# ======================================================================

def generate_personalized_email(contact: Dict[str,str], azure_client: AzureOpenAI, cfg: Dict[str,str], company_info: str="", debug: bool=False) -> Optional[str]:
    email_username = contact["email"].split("@")[0] if "@" in contact["email"] else ""
    founder_name = cfg["FOUNDER_NAME"]
    founder_city = cfg["FOUNDER_CITY"]
    founder_state = cfg["FOUNDER_STATE"]

    prompt = f"""Persona:
You are {founder_name} — Founder of The Utility Company (TUC) and creator of PortalPay. Write entirely in first person (I/me) as {founder_name}; never refer to yourself in third person. Your voice is principled builder, analytical and candid, confident but not salesy.

Goal:
Craft a personalized VC outreach email about PortalPay tailored to the recipient, using any available firm/company research.

Voice and Style:
- Narrative, insight-driven prose; no section headings or bullet points in the email body.
- Avoid phrases like “Founder note”.
- Be concise, confident, and specific; show operator depth and strategic clarity.

PortalPay Briefing (context for personalization):
- Crypto-native payment gateway enabling physical merchants to accept stablecoins and crypto tokens at checkout via QR scan; on-chain settlement that’s transparent and efficient.
- Innovations:
  • Multi-Token Infrastructure: USDC, USDT, cbBTC, cbXRP, ETH on Base
  • Cost Revolution: 2–3% savings vs card rails via on-chain settlement
  • Instant Settlement: Real-time finality (no 2–3 day delays)
  • White-Label Platform: Fully branded portals, custom theming, receipt personalization
  • Smart Treasury: Configurable token mixes with intelligent rotation
  • Programmable Revenue: On-chain revenue splits for partners/franchises
  • Real-Time Intelligence: Live tracking, USD volume analytics, trend insights
  • Global by Default: Borderless stablecoin settlement eliminates FX friction
- Opportunity: Horizontal platform play attacking 2.5–3.5% payment processing drag across physical POS; $100B+ addressable market.
- Tech stack: Thirdweb SDK, Base network, Next.js, Azure Cosmos DB, liquid glass morphism UI
- Traction: Live merchants, white-label ready, comprehensive API docs, multi-chain roadmap (Solana, Polygon, Arbitrum)

Meeting Preferences (embed naturally in CTA):
- I am based in {founder_city}, {founder_state}.
- I’m available for remote meetings with all investors.
- In-person meetings only if you’re local to my city or region.

Contact:
- Name: {contact.get('name','')}
- Firm: {contact.get('firm','')}
- Email Username: {email_username}
- Title: {contact.get('title','')}
- Investment Type: {contact.get('type','')}
- Location: {contact.get('location','')}

Company Research (optional):
{company_info if company_info else "N/A"}

Requirements:
- Output JSON ONLY with keys "subject" and "body". Example: {{"subject":"...","body":"..."}}
- Body MUST be plain text (no HTML, signature, resources section, footers, or disclaimers).
- Length: 250–300 words.
- Open with a hook tied to their thesis/portfolio using available research.
- Personalize: connect PortalPay’s value to their focus; demonstrate homework.
- Use preferred nickname if the email username or research suggests one.
- Maintain first-person voice throughout (I/me). No third-person references. No “Founder note”.
- No explicit headings; write as natural prose paragraphs.
- End with a confident CTA that mentions remote availability and my location.

Return EXACTLY this JSON object:
{{
  "subject": "<compelling personalized subject>",
  "body": "<plain text body with paragraph breaks>"
}}"""

    try:
        if debug:
            print(f"  DEBUG: Calling Azure OpenAI model: {cfg['AZURE_OPENAI_DEPLOYMENT']}")
        response = azure_client.chat.completions.create(
            model=cfg["AZURE_OPENAI_DEPLOYMENT"],
            messages=[
                {
                    "role": "system",
                    "content": f"You are {founder_name}. Write outreach emails AS YOURSELF in first person (I/me) — never third person. Return JSON with keys 'subject' and 'body' only. Do not include HTML/signatures/resources/disclaimers."
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"  ERROR: Azure OpenAI call failed: {e}")
        return None

def parse_email_json(generated_text: str) -> (str, str):
    try:
        obj = json.loads(generated_text)
        subject = str(obj.get("subject","")).strip()
        body = str(obj.get("body","")).strip()
        if not subject:
            subject = "Exploring Partnership Opportunities"
        # Defensive trimming
        safe_lines = []
        for l in body.splitlines():
            low = l.strip().lower()
            if "founder note" in low or low.startswith("resources"):
                break
            if l.strip():
                safe_lines.append(l.strip())
        body = "\n".join(safe_lines).strip()
        return subject, body
    except Exception:
        return "Exploring Partnership Opportunities", generated_text.strip()

# ======================================================================
# HTML ASSEMBLY + SENDING
# ======================================================================

SIGNATURE_HTML = ""  # OSS: No fixed signature appended; keep plain text body per prompt

def build_email_html(body_text: str, cfg: Dict[str,str], utm_id: str, recipient_email: str) -> str:
    # Minimal HTML container wrapping plain text paragraphs
    paras = [p.strip() for p in body_text.split("\n") if p.strip()]
    body_html = "".join([f'<p style="margin:0 0 16px 0;font-size:15px;color:#111827;">{p}</p>' for p in paras])

    def tag_link(base: str) -> str:
        if not base:
            return ""
        return f"{base}{'?' if '?' not in base else '&'}utm_source=vcoutreach&utm_medium=email&utm_campaign=portalpay&utm_id={utm_id}"

    portalpay = tag_link(cfg["PORTALPAY_LINK"]) if cfg["PORTALPAY_LINK"] else ""
    calendar = tag_link(cfg["CALENDAR_LINK"]) if cfg["CALENDAR_LINK"] else ""
    investor = tag_link(cfg["INVESTOR_PORTAL_LINK"]) if cfg["INVESTOR_PORTAL_LINK"] else ""
    dataroom = tag_link(cfg["DATA_ROOM_LINK"]) if cfg["DATA_ROOM_LINK"] else ""

    resources = ""
    def row(label: str, url: str) -> str:
        if not url:
            return ""
        return f'<p style="margin:8px 0;"><a href="{url}" style="color:#2563eb;text-decoration:none;font-weight:600;">{label}</a></p>'
    resources += row("Explore PortalPay", portalpay)
    resources += row("Schedule a Call", calendar)
    resources += row("View Investor Portal", investor)
    resources += row("Access Data Room", dataroom)

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
</head><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;">
{body_html}
<div style="margin:24px 0; padding:12px; border-top:1px solid #e5e7eb;">
  <div style="font-size:12px;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:8px;">Resources</div>
  {resources}
</div>
</body></html>"""
    # Tracking pixel
    try:
        if cfg["TRACKING_PIXEL_URL"] and utm_id:
            pixel_src = (
                f"{cfg['TRACKING_PIXEL_URL']}{'?' if '?' not in cfg['TRACKING_PIXEL_URL'] else '&'}"
                f"utm_id={utm_id}"
                f"&email={requests.utils.quote(recipient_email or '')}"
                f"&name={requests.utils.quote('')}"
                f"&firm={requests.utils.quote('')}"
                f"&subject={requests.utils.quote('')}"
                f"&campaign=vcoutreach"
                f"&r={int(time.time())}"
            )
            html = html.replace("</body>", f'<img src="{pixel_src}" width="1" height="1" style="display:block;border:0;opacity:0;" alt=""></body>')
    except Exception:
        pass
    return html

def send_email(service, to_email: str, subject: str, html_body: str, debug: bool=False) -> Optional[str]:
    try:
        message = MIMEMultipart("alternative")
        message["to"] = to_email
        message["subject"] = subject

        plain_text = re.sub("<[^<]+?>", "", html_body)
        part1 = MIMEText(plain_text, "plain")
        part2 = MIMEText(html_body, "html")
        message.attach(part1)
        message.attach(part2)

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        result = service.users().messages().send(userId="me", body={"raw": raw}).execute()
        if debug:
            print(f"  DEBUG: Sent to {to_email}, id={result.get('id')}")
        return result.get("id")
    except Exception as e:
        print(f"  ERROR: Gmail send failed: {e}")
        return None

# ======================================================================
# MAIN
# ======================================================================

def main():
    parser = argparse.ArgumentParser(description="Open Source VC Outreach Automation (OSS Edition)")
    parser.add_argument("--setup", action="store_true", help="Interactive setup to enter required configuration values")
    parser.add_argument("--dry-run", action="store_true", help="Generate and assemble email but do NOT send or log")
    parser.add_argument("--debug", action="store_true", help="Enable verbose logging")
    parser.add_argument("--report", action="store_true", help="Show sent_emails_log.csv summary and exit")
    parser.add_argument("--log-file", type=str, help="Override path to sent_emails_log.csv")
    parser.add_argument("--contacts", type=str, help="Override contacts CSV path")
    args = parser.parse_args()

    cfg = get_cfg()
    if args.setup:
        cfg = prompt_missing(cfg)

    # CLI overrides
    if args.log_file:
        cfg["LOG_FILE"] = args.log_file
    if args.contacts:
        cfg["CONTACTS_FILE"] = args.contacts

    # Print resolved config subset
    log_path = Path(cfg["LOG_FILE"])
    print("="*70)
    print("OSS VC OUTREACH")
    print("="*70)
    print(f"Contacts: {cfg['CONTACTS_FILE']}")
    print(f"Log file: {log_path} {'(exists)' if log_path.exists() else '(will be created)'}")
    print()

    # Report mode
    if args.report:
        if not log_path.exists():
            print(f"No log found at: {log_path}")
            return
        try:
            df = pd.read_csv(log_path)
            print(f"Rows: {len(df)}")
            if "email" in df.columns:
                print(f"Unique recipients: {df['email'].dropna().nunique()}")
            if "timestamp" in df.columns:
                per_day = df.groupby(pd.to_datetime(df["timestamp"], errors="coerce").dt.date).size()
                print("Per-day counts (latest 10):")
                for d, c in per_day.sort_index(ascending=False).head(10).items():
                    print(f"  {d}: {c}")
        except Exception as e:
            print(f"Error reading log: {e}")
        return

    # Azure OpenAI client
    if not all([cfg["AZURE_OPENAI_ENDPOINT"], cfg["AZURE_OPENAI_API_KEY"], cfg["AZURE_OPENAI_DEPLOYMENT"]]):
        print("ERROR: Missing Azure OpenAI configuration. Set env vars or run with --setup.")
        sys.exit(1)

    azure_client = AzureOpenAI(
        api_key=cfg["AZURE_OPENAI_API_KEY"],
        api_version=cfg["AZURE_OPENAI_API_VERSION"],
        azure_endpoint=cfg["AZURE_OPENAI_ENDPOINT"]
    )
    print("✓ Azure OpenAI client initialized")

    # Gmail service
    gmail_service = None
    if args.dry_run:
        print("DRY RUN: Skipping Gmail OAuth")
    else:
        gmail_service = get_gmail_service(cfg)
        print("✓ Gmail service initialized")

    # Contacts
    contacts_df = load_contacts_csv(cfg["CONTACTS_FILE"])
    print(f"Loaded {len(contacts_df)} contacts")

    # Sent log guard
    sent_guard = set()
    if not args.dry_run:
        ensure_log_exists(log_path)
        sent_guard = load_sent_log(log_path)
        print(f"Already sent (guard): {len(sent_guard)}")

    # Filter unsent
    unsent_df = contacts_df[~contacts_df["email"].isin(sent_guard)]
    daily_limit = int(cfg["DAILY_LIMIT"])
    batch_df = unsent_df.head(daily_limit)
    print(f"Processing batch of {len(batch_df)}")

    sent_count = 0
    failed_count = 0

    for _, contact in batch_df.iterrows():
        email = contact["email"]
        print(f"[{sent_count+1}/{len(batch_df)}] {contact.get('name','')} <{email}>")

        # Company info (best effort based on domain)
        domain = email.split("@")[1] if "@" in email else ""
        info = lookup_company_info(domain, contact.get("firm",""), debug=args.debug)

        generated = generate_personalized_email(contact.to_dict(), azure_client, cfg, company_info=info, debug=args.debug)
        if not generated:
            print("  ✗ Generation failed")
            failed_count += 1
            continue

        subject, body_text = parse_email_json(generated)
        utm_id = hashlib.sha256(email.encode("utf-8")).hexdigest()[:12]
        html_body = build_email_html(body_text, cfg, utm_id, email)

        print(f"  Subject: {subject}")

        if args.dry_run:
            print("  DRY RUN: Preview (first 350 chars):")
            print((body_text[:350] + ("..." if len(body_text) > 350 else "")))
            continue

        # Send to real recipient
        message_id = send_email(gmail_service, email, subject, html_body, debug=args.debug)
        if message_id:
            print("  ✓ Sent")
            append_sent_log(log_path, email, contact.get("name",""), contact.get("firm",""), message_id)
            sent_count += 1
            # Rate limiting
            interval = int(cfg["SECONDS_BETWEEN_EMAILS"])
            if sent_count < len(batch_df):
                print(f"  Waiting {interval} seconds ...")
                time.sleep(interval)
        else:
            print("  ✗ Send failed")
            failed_count += 1

        print()

    print("="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Sent: {sent_count}")
    print(f"Failed: {failed_count}")
    print(f"Remaining (unsent in list): {len(unsent_df) - sent_count}")
    print("Done.")

if __name__ == "__main__":
    main()