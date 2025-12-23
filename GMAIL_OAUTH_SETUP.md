# Gmail OAuth Setup Guide

## Issue: "Access blocked: VCRun can only be used within its organization"

This error (Error 403: org_internal) occurs when your Gmail OAuth app is configured as "Internal" but you're trying to sign in with an account outside the organization.

## Solution: Configure OAuth App as External

### Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one if needed)

### Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. You'll see the current configuration showing "Internal" or "External"

3. **If it shows "Internal":**
   - Click **"MAKE EXTERNAL"** button
   - Or click **"Edit App"** and change User Type to **"External"**

4. Fill in the required fields:
   - **App name**: VCRun (or PortalPay Email Automation)
   - **User support email**: info@theutilitycompany.co
   - **Developer contact email**: info@theutilitycompany.co
   - **App domain** (optional): Can leave blank for now
   - **Authorized domains**: theutilitycompany.co

5. Click **"Save and Continue"**

6. **Scopes** (already configured if you created credentials):
   - Should have `https://www.googleapis.com/auth/gmail.send`
   - Click **"Save and Continue"**

7. **Test users** (for External apps in testing mode):
   - Add your email: info@theutilitycompany.co
   - Click **"Save and Continue"**

8. Click **"Back to Dashboard"**

### Step 3: Verify or Recreate Credentials

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID or create new one:
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **"Desktop app"**
   - Name: **"VCRun"**
   - Click **"Create"**

3. **Download the JSON file**:
   - Click the download icon next to your OAuth client
   - Save as `gmail_credentials.json`
   - Place in the same directory as `vcrun.py`

### Step 4: Delete Old Token

If you had a previous authentication attempt:
```bash
# Delete the old token file
del gmail_token.pickle   # Windows
# or
rm gmail_token.pickle    # Mac/Linux
```

### Step 5: Run the Script Again

```bash
python vcrun.py
```

The OAuth flow will now work because the app is configured as "External" and you're added as a test user.

## Alternative: Use Google Workspace Organization Account

If you want to keep the app as "Internal":
- The OAuth app must be created in a Google Workspace organization's Cloud Console
- You can only sign in with accounts from that same Google Workspace organization
- If info@theutilitycompany.co is not in that organization, you'll continue getting the error

## Publishing the App (Optional - For Production)

Once testing is complete and you want to use it without restrictions:

1. Go to **OAuth consent screen**
2. Click **"Publish App"**
3. Submit for verification if sending to external users
4. For internal use with small recipient lists, "Testing" status is sufficient

## Troubleshooting

**Still getting org_internal error?**
- Verify the OAuth consent screen shows "External"
- Make sure you downloaded the credentials AFTER changing to External
- Delete gmail_token.pickle and try again
- Clear browser cookies for Google OAuth

**Need to send from a different email?**
- The Gmail account you authenticate with will be the "From" address
- Make sure you own/control that Gmail account
- You cannot send from arbitrary addresses via Gmail API

**Rate limits:**
- Gmail API: 250 quota units per user per second
- Our script uses 50 emails/hour which is well within limits
- The 72-second delay prevents triggering spam filters
