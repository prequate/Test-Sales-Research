# Sales Research: a live demo in 10 steps

Type a company name. Gemini searches the live web and writes a one page sales brief. Supabase saves every brief for the team. Vercel puts the app online. GitHub holds the code and pushes every change live.

**What you need before you start:** free accounts on GitHub, Supabase, Vercel and Google AI Studio. Check each provider's current free tier limits before the workshop, including the limit on Gemini's Google Search feature; these change from time to time.

**Time:** about 40 minutes live, leaving 20 minutes for questions in a one hour slot.

## What's in the project

| File | What it does | Which tool it belongs to |
|---|---|---|
| `index.html` | The page people see: a search box, the brief, and a list of past research | Served by **Vercel** |
| `api/research.js` | The back office: asks Gemini to research, saves and reads briefs | Runs on **Vercel**, talks to **Gemini** and **Supabase** |
| `setup.sql` | Creates the `research` table | Run once in **Supabase** |
| `package.json` | Tells Vercel this is a modern Node project | **Vercel** |

There are no packages to install and nothing to build, so the room sees only the four tools.

## What the brief contains

What the company does, sector, HQ and founding year, size signals (funding, revenue, headcount, each marked as reported), key people, recent news, three likely challenges, how an advisory firm could help, a suggested opening line for an email to the founder, and the web sources Gemini used.

---

## The 10 steps

### Part A. GitHub: keep the code (5 min)

**Step 1. Put the code on GitHub.**
Go to github.com, click **New repository**, name it `sales-research`, and create it. Click **uploading an existing file**, drag in every file from this folder (keep the `api` folder intact), and click **Commit changes**.

> Say to the room: *This is the recipe book. Every change from now on is recorded.*

### Part B. Supabase: keep the data (10 min)

**Step 2. Create a Supabase project.**
Go to supabase.com, click **New project**, give it a name and a database password, and wait about a minute.

**Step 3. Create the table.**
Open **SQL Editor**, click **New query**, paste the contents of `setup.sql`, and click **Run**. Open **Table Editor** and show the empty `research` table.

**Step 4. Copy two values from Supabase.**
Open **Project Settings**, then **API Keys**. Copy the **Project URL** (like `https://abcd.supabase.co`) and the **Secret key** (starts with `sb_secret_`). If your project only shows legacy keys, use the `service_role` key.

> Say to the room: *This is the pantry. Every brief we create is kept here, so nobody researches the same company twice.*

### Part C. Gemini: the thinking (5 min)

**Step 5. Get a Gemini API key.**
Go to aistudio.google.com, click **Get API key**, then **Create API key**, and copy it.

> Say to the room: *This is the chef. We will give it a company name, and it will search the web and write the brief.*

### Part D. Vercel: put it live (10 min)

**Step 6. Import the project into Vercel.**
Go to vercel.com, click **Add New**, then **Project**, connect GitHub, and pick `sales-research`. Leave the framework preset as **Other**. Do not deploy yet.

**Step 7. Add the three keys.**
Under **Environment Variables**, add:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | from Step 5 |
| `SUPABASE_URL` | the Project URL from Step 4 |
| `SUPABASE_SECRET_KEY` | the secret key from Step 4 |

> Say to the room: *The keys live on Vercel, never in the browser and never on GitHub.*

**Step 8. Deploy.**
Click **Deploy**. In under a minute you get a live link. Share it in the team chat so everyone can open it on their phone.

### Part E. See it work (10 min)

**Step 9. Research a company live.**
Ask the room to name a company, ideally a prospect or a well known D2C brand. Type it and click **Research**. After 15 to 40 seconds the brief appears, with sources at the bottom.
Switch to the Supabase **Table Editor** and refresh: the brief is saved there. Back in the app, click it in **Researched so far** to show it loads instantly, without researching again.

> Point out: *Click a source. The AI shows where its facts came from, and we still check figures before they go to a client.*

**Step 10. Change the code and watch it go live.**
On GitHub, open `index.html`, click the pencil icon, change `<h1>Sales Research</h1>` to `<h1>Prequate Sales Research</h1>`, and click **Commit changes**. Switch to Vercel and show the new deployment starting on its own. Refresh the live link about a minute later: the new title is there, and every saved brief is still in the list.

> Close with: *Four tools, one platform. GitHub kept the change, Vercel shipped it, Supabase kept the research, Gemini did the thinking.*

---

## Before the workshop

Do a full dry run the day before with the same accounts. Research two or three companies in advance so the history list is not empty when you start.
To save time live, complete Steps 2 to 5 in advance and show them as screens already set up.

## If something goes wrong

| What you see | Likely cause | Fix |
|---|---|---|
| "Missing environment variables" | A key was not added in Step 7 | Add it in Vercel, Settings, Environment Variables, then **Redeploy** |
| An error starting with "Supabase" | Wrong key, or the table was not created | Recheck Steps 3 and 4 |
| An error starting with "Gemini" | Wrong key, a usage limit, or a model name change | Recheck Step 5 and your AI Studio limits. To pin a model, add a `GEMINI_MODEL` variable in Vercel |
| "Gemini did not return a brief" | The model replied in an unexpected format | Click Research again |
| The request times out | The research ran past the time limit | Try again. In Vercel, Settings, Functions, check the maximum duration allowed on your plan |

## A note on accuracy and security

The brief is AI generated from public web pages. Treat every number as unverified until checked against the source, especially revenue and funding.
This is a demo: anyone with the link can run research and see saved briefs. Add a login (Supabase Auth handles this) before using it for real prospect lists.
