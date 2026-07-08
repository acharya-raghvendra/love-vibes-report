// Bootstrap disabled after initial admin seed.
Deno.serve(() => new Response("Gone", { status: 410 }));
