const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${BACKEND}/simulate/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action") ?? "status";

  if (!id) {
    return Response.json({ error: "Missing simulation id" }, { status: 400 });
  }

  const endpoint = action === "results"
    ? `${BACKEND}/simulate/${id}/results`
    : `${BACKEND}/simulate/${id}/status`;

  const res = await fetch(endpoint);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
