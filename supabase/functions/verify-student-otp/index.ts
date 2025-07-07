// Supabase Edge Function: verify-student-otp
// Verifies a student's OTP for login
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  try {
    let body = null;
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    }
    let { matric_no, email, otp } = body || {};
    if (!matric_no || !email || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing matric_no, email, or otp" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Lowercase email for consistent matching
    email = email.toLowerCase();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase env vars not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Find OTP
    const { data: otpRow, error: otpError } = await supabase
      .from("student_otps")
      .select("*")
      .eq("matric_no", matric_no)
      .eq("email", email)
      .eq("otp_code", otp)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .single();
    if (otpError || !otpRow) {
      // Debug info for troubleshooting
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired OTP",
          debug: {
            matric_no,
            email,
            otp,
            otpError,
            otpRow,
            now: new Date().toISOString()
          }
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Mark OTP as used
    await supabase
      .from("student_otps")
      .update({ used: true })
      .eq("id", otpRow.id);
    // Optionally, you can return student info here
    return new Response(
      JSON.stringify({ success: true, message: "OTP verified" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
