// Netlify Scheduled Function — runs weekly and asks the site's own
// /api/public/hooks/refresh-events endpoint to re-scrape every venue.
//
// Needs FIRECRAWL_API_KEY and REFRESH_EVENTS_SECRET set as Netlify
// environment variables (Site settings → Environment variables).
export default async () => {
  const siteUrl = process.env.URL;
  const apiKey = process.env.REFRESH_EVENTS_SECRET;

  if (!siteUrl || !apiKey) {
    console.error("refresh-events-cron: missing URL or REFRESH_EVENTS_SECRET env var");
    return new Response("Missing config", { status: 500 });
  }

  const res = await fetch(`${siteUrl}/api/public/hooks/refresh-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: apiKey },
    body: "{}",
  });

  const summary = await res.text();
  console.log("refresh-events-cron result:", summary);
  return new Response(summary, { status: res.status });
};

export const config = {
  // 6am Pacific, every Thursday — fresh data ahead of weekend browsing.
  schedule: "0 13 * * 4",
};
