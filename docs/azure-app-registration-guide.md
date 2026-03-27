# Azure AD App Registration — Step-by-Step Guide

This guide walks through creating the App Registration that Orion needs to read Excel files from Alek's OneDrive for Business account. No prior Azure experience required.

---

## What you need before starting

- **A browser** (Chrome/Edge recommended)
- **Login credentials** for the `tcg22` Microsoft 365 tenant — the account must have **Global Administrator** or **Application Administrator** role
- About **15 minutes**

---

## Step 1: Open the Azure Portal

1. Go to **https://entra.microsoft.com** (this is the new name for Azure AD)
2. Sign in with your `tcg22` tenant admin account (e.g. `admin@puertaabierta.com.gt` or whichever account has admin rights)
3. You should see the **Microsoft Entra admin center** dashboard

> **If you see "You don't have access":** Your account doesn't have admin privileges on this tenant. You need someone with Global Administrator role to either do this themselves or grant you the Application Administrator role first.

---

## Step 2: Navigate to App Registrations

1. In the left sidebar, click **Applications** (you may need to expand it first)
2. Click **App registrations**
3. You'll see a list of existing app registrations (may be empty)

**Alternative path:** If you don't see "Applications" in the sidebar:
- Click the hamburger menu (☰) at the top-left
- Search for **"App registrations"** in the search bar at the top
- Click the result

---

## Step 3: Create a New Registration

1. Click the **+ New registration** button at the top
2. Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `Orion OneDrive Sync` |
| **Supported account types** | Select **"Accounts in this organizational directory only (tcg22 only — Single tenant)"** — this is the first option and should be pre-selected |
| **Redirect URI** | Leave blank (we don't need one — this is a background service, not a user login) |

3. Click **Register**

You'll be taken to the app's overview page. You should see:
- **Application (client) ID** — a UUID like `a1b2c3d4-e5f6-...`
- **Directory (tenant) ID** — another UUID

> **Write these down now.** You'll need both later. These are the values for `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`.

---

## Step 4: Create a Client Secret

1. In the left sidebar of your app registration, click **Certificates & secrets**
2. Click the **Client secrets** tab (should already be selected)
3. Click **+ New client secret**
4. Fill in:

| Field | Value |
|-------|-------|
| **Description** | `Orion production` |
| **Expires** | Select **24 months** (the maximum — you'll need to rotate this before it expires) |

5. Click **Add**

6. **IMPORTANT:** You'll see the secret **Value** column. **Copy it immediately.** Once you navigate away, you can never see this value again. It looks like a long random string: `abc123~XYZ...`

> This is the value for `AZURE_CLIENT_SECRET`. If you lose it, you'll have to delete this secret and create a new one.

| Env Variable | Where to find it |
|-------------|-----------------|
| `AZURE_TENANT_ID` | App overview page → "Directory (tenant) ID" |
| `AZURE_CLIENT_ID` | App overview page → "Application (client) ID" |
| `AZURE_CLIENT_SECRET` | The secret Value you just copied |

---

## Step 5: Add the Files.Read.All Permission

1. In the left sidebar of your app registration, click **API permissions**
2. You'll see one permission already listed: `User.Read` (this was added automatically — it's fine to leave it)
3. Click **+ Add a permission**
4. A panel opens on the right. Click **Microsoft Graph** (the first big option at the top)
5. You'll see two tabs: **Delegated permissions** and **Application permissions**. Click **Application permissions** (the second tab)
6. In the search box, type **`Files`**
7. Expand the **Files** section in the results
8. Check the box next to **`Files.Read.All`**
9. Click **Add permissions** at the bottom of the panel

You should now see `Files.Read.All` in the permissions list with a warning icon: "Not granted for tcg22".

---

## Step 6: Grant Admin Consent

The permission you just added requires **admin consent** — this is Microsoft's way of ensuring an admin explicitly approves the app's access.

1. Still on the **API permissions** page, click the **Grant admin consent for tcg22** button (it's near the top, next to "+ Add a permission")
2. A confirmation dialog appears: "Do you want to grant consent for the requested permissions for all accounts in tcg22?"
3. Click **Yes**

The warning icon next to `Files.Read.All` should change to a **green checkmark** with the text "Granted for tcg22".

> **If the "Grant admin consent" button is grayed out:** Your account doesn't have sufficient admin privileges. You need a Global Administrator to click this button.

---

## Step 7: Verify Everything

Your API permissions page should now show:

| Permission | Type | Status |
|-----------|------|--------|
| `Files.Read.All` | Application | ✅ Granted for tcg22 |
| `User.Read` | Delegated | ✅ Granted for tcg22 |

Go back to the **Overview** page (left sidebar) and confirm you have all three values:

| Env Variable | Value |
|-------------|-------|
| `AZURE_TENANT_ID` | Directory (tenant) ID from the Overview page |
| `AZURE_CLIENT_ID` | Application (client) ID from the Overview page |
| `AZURE_CLIENT_SECRET` | The secret you copied in Step 4 |

---

## Step 8: Set the Env Vars in Vercel

1. Go to **https://vercel.com** and open the **Orion** project
2. Click **Settings** (top nav)
3. Click **Environment Variables** (left sidebar)
4. Add each variable:

| Key | Value | Environment |
|-----|-------|-------------|
| `AZURE_TENANT_ID` | *(paste the tenant ID)* | Production |
| `AZURE_CLIENT_ID` | *(paste the client ID)* | Production |
| `AZURE_CLIENT_SECRET` | *(paste the secret value)* | Production |

5. For each one: type the key, paste the value, select **Production** as the environment, and click **Save**

> `CRON_SECRET` is auto-provisioned by Vercel when you deploy the cron job — you don't need to set it manually.

---

## Troubleshooting

### "Insufficient privileges" when granting admin consent
Your account needs the **Global Administrator** role on the tenant. Check with whoever set up the M365 tenant.

### "AADSTS7000215: Invalid client secret"
You copied the secret **ID** instead of the secret **Value**. The ID is the shorter identifier in the first column — you need the longer string in the "Value" column. If you can no longer see it, delete the secret and create a new one (Step 4).

### "AADSTS700016: Application not found in the directory"
Double-check `AZURE_TENANT_ID` — you may have copied the wrong UUID. The tenant ID is the "Directory (tenant) ID", not the "Object ID".

### Sync returns "403 Forbidden" or "Access denied"
- Verify admin consent was granted (green checkmark in Step 6)
- Wait 5 minutes — permission propagation can take a few minutes after granting consent
- Confirm the permission is **`Files.Read.All`** under **Application permissions** (not Delegated)

### "The specified user was not found" during sync
The app can't find the user `alek_hernandez@puertaabierta.com.gt`. Verify this email address is correct and the user has an active M365 license with OneDrive.

---

## Security Notes

- This app can read **all files** from **all users** in the tenant (that's what `Files.Read.All` means at the Application level). There is no narrower permission available from Microsoft for app-only access.
- The client secret expires in 24 months. Set a calendar reminder to rotate it before expiration.
- Never share the client secret via email or chat. Use Vercel's encrypted env vars.
- If the secret is compromised, delete it immediately from the Azure portal (Certificates & secrets → delete the secret) and create a new one.
