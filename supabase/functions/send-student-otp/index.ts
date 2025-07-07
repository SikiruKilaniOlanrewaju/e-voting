// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced error logging and diagnostics
// Robust CORS and method handling
Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    // Always return 200 for preflight
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    // Only allow POST
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed", details: null }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Incoming request to send-student-otp");
    let body = null;
    if (req.headers.get("content-type")?.includes("application/json")) {
      try {
        body = await req.json();
      } catch (jsonErr) {
        console.error("Invalid JSON body", jsonErr);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid JSON body", details: jsonErr.message ?? null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    } else {
      // If not JSON, try to parse as text and then as JSON
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        console.error("Body is not valid JSON", jsonErr);
        return new Response(
          JSON.stringify({ success: false, error: "Body is not valid JSON", details: jsonErr.message ?? null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
    }
    const { matric_no } = body || {};
    if (!matric_no) {
      console.error("matric_no missing in request");
      return new Response(
        JSON.stringify({ success: false, error: "matric_no is required", details: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Setup Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase env vars not set", { supabaseUrl, supabaseKey });
      return new Response(
        JSON.stringify({ success: false, error: "Supabase env vars not set", details: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up student email by matric_no
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("email")
      .eq("matric_no", matric_no)
      .single();
    if (studentError || !student) {
      console.error("Student lookup failed", { studentError, student });
      return new Response(
        JSON.stringify({ success: false, error: "Student not found", details: studentError?.message ?? null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    const email = student.email;
    console.log(`Student found: ${email}`);

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP: ${otp}`);

    // Mark old OTPs as used
    const { error: updateError } = await supabase
      .from("student_otps")
      .update({ used: true })
      .eq("matric_no", matric_no)
      .eq("email", email)
      .eq("used", false);
    if (updateError) {
      console.error("Failed to mark old OTPs as used", updateError);
    }

    // Insert new OTP
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry
    const { error: insertError } = await supabase.from("student_otps").insert([
      {
        matric_no,
        email,
        otp_code: otp,
        used: false,
        expires_at,
      },
    ]);
    if (insertError) {
      console.error("Failed to insert new OTP", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to insert OTP", details: insertError.message ?? null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Send OTP email using custom Node.js backend
    let emailSent = false;
    let emailError = null;
    let smtpBackendUrl = Deno.env.get("SMTP_BACKEND_URL") || "http://localhost:3001/send-otp";
    try {
      const emailRes = await fetch(smtpBackendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, otp })
      });
      if (emailRes.ok) {
        emailSent = true;
        console.log(`OTP email sent to ${email} via backend`);
      } else {
        emailError = await emailRes.text();
        console.error("Failed to send OTP email via backend:", emailError);
      }
    } catch (smtpErr) {
      emailError = smtpErr.message || smtpErr.toString();
      console.error("Failed to send OTP email via backend:", emailError);
    }

    return new Response(JSON.stringify({
      success: true,
      emailSent: !!emailSent,
      emailError: emailError ?? null,
      smtpDebug: {
        smtpBackendUrl,
        email,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error in OTP function", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message ?? "Unknown error", details: err.stack ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
