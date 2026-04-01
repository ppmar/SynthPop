const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${BACKEND}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  if (action === "list") {
    const res = await fetch(`${BACKEND}/populations`);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  }

  if (id) {
    const res = await fetch(`${BACKEND}/populations/${id}`);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  }

  return Response.json({ error: "Missing action or id" }, { status: 400 });
}
