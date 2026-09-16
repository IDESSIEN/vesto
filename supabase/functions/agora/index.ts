/**
 * Server-side proxy for Agora Public API — keeps AGORA_API_KEY off the client.
 * Deploy: supabase secrets set AGORA_API_KEY=... && supabase functions deploy agora
 * Client: VITE_AGORA_API_BASE=https://<project>.supabase.co/functions/v1/agora
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const AGORA_ORIGIN = 'https://api.agora.finance';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

let sessionJwt: string | null = null;
let sessionExpiresAt = 0;

async function exchangeSession(apiKey: string): Promise<string> {
  const now = Date.now();
  if (sessionJwt && sessionExpiresAt > now + 60_000) {
    return sessionJwt;
  }

  const response = await fetch(`${AGORA_ORIGIN}/v0/auth/token`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Agora auth failed (${response.status}): ${body}`);
  }

  const { sessionJwt: jwt } = (await response.json()) as { sessionJwt: string };
  sessionJwt = jwt;
  sessionExpiresAt = now + 14 * 60 * 1000;
  return jwt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('AGORA_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AGORA_API_KEY secret is not set' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const prefix = '/functions/v1/agora';
  const agoraPath = url.pathname.startsWith(prefix)
    ? url.pathname.slice(prefix.length) || '/'
    : url.pathname;

  try {
    const jwt = await exchangeSession(apiKey);
    const forwardUrl = `${AGORA_ORIGIN}${agoraPath}${url.search}`;

    const forwardHeaders = new Headers(req.headers);
    forwardHeaders.set('Authorization', `Bearer ${jwt}`);
    forwardHeaders.delete('host');

    const forwardResponse = await fetch(forwardUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
    });

    const responseBody = await forwardResponse.text();
    return new Response(responseBody, {
      status: forwardResponse.status,
      headers: {
        ...corsHeaders,
        'Content-Type': forwardResponse.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Agora proxy error' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
