import { getDatabase } from "@/db";
import { z } from "zod";
const signup = z.object({ email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), neighborhood: z.string().trim().min(2).max(120), website: z.string().max(200).optional() });
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({error:"Please submit the form from the OutRN page."},{status:403});
  if (Number(request.headers.get("content-length") || 0) > 4096) return Response.json({error:"Please use a shorter entry."},{status:413});
  let body;
  try { const raw=await request.text(); if(raw.length>4096) return Response.json({error:"Please use a shorter entry."},{status:413}); body=JSON.parse(raw); }
  catch { return Response.json({error:"Please check your details and try again."},{status:400}); }
  const parsed = signup.safeParse(body);
  if (!parsed.success) return Response.json({error:"Enter a valid email and a neighborhood or city (2–120 characters)."},{status:400});
  if (parsed.data.website) return Response.json({ok:true});
  try {
    await getDatabase().prepare("INSERT INTO waitlist (email, neighborhood) VALUES (?, ?) ON CONFLICT(email) DO NOTHING").bind(parsed.data.email,parsed.data.neighborhood).run();
    return Response.json({ok:true},{status:201,headers:{"Cache-Control":"no-store"}});
  } catch(error) { console.error("Waitlist save failed",error instanceof Error ? error.message : "Unknown error"); return Response.json({error:"We couldn’t save your spot right now. Please try again shortly."},{status:503}); }
}
