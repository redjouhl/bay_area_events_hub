import { createFileRoute } from "@tanstack/react-router";

async function handleRefresh(request: Request) {
  const apiKey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
  const expected = process.env["REFRESH_EVENTS_SECRET"];
  if (!expected || apiKey !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let venues: string[] | undefined;
  try {
    const body = (await request.json()) as { venues?: string[] };
    if (Array.isArray(body?.venues)) venues = body.venues.filter((v) => typeof v === "string");
  } catch {
    venues = undefined;
  }

  try {
    const { refreshEvents } = await import("@/lib/scrape-events.server");
    const summary = await refreshEvents(venues);
    return new Response(JSON.stringify(summary), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("refresh-events failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/public/hooks/refresh-events")({
  server: {
    handlers: {
      POST: ({ request }) => handleRefresh(request),
    },
  },
});
