export async function onRequest(context) {
  return Response.json({
    url:  context.env.SUPABASE_URL,
    anon: context.env.SUPABASE_ANON,
  });
}
