// supabase/functions/send-bug-report/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TO_EMAIL = "nviolet0120@gmail.com";      // where you receive bug reports
const FROM_EMAIL = "itsveedev@gmail.com";      // personal sender email

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not set in environment variables.");
    }

    const { summary, description, userEmail } = await req.json();
    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: `Houreum Bug Reporter <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      subject: `New Bug Report: ${summary}`,
      html: `
        <h1>New Bug Report</h1>
        <p><strong>From:</strong> ${userEmail}</p>
        <hr>
        <h2>Summary</h2>
        <p>${summary}</p>
        <hr>
        <h2>Description</h2>
        <p style="white-space: pre-wrap;">${description}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
