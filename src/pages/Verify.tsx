import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";

type GateStatus =
  | "checking"
  | "ready"
  | "sending"
  | "sent"
  | "verified"
  | "blocked"
  | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function Verify() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<GateStatus>("checking");
  const [message, setMessage] = useState("Checking CyberCrowd gate...");
  const [plugTrace, setPlugTrace] = useState({
    config: "checking",
    email: "waiting",
    redirect: "waiting",
    session: "waiting",
    room: "waiting",
  });

  const supabase = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return null;
    }

    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }, []);

  function setPlug(name: keyof typeof plugTrace, value: string) {
    setPlugTrace((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function getReturnUrl() {
    return `${window.location.origin}/verify?verified=1`;
  }

  async function checkSession() {
    if (!supabase) {
      setStatus("error");
      setMessage("Security gate config is missing.");
      setPlug("config", "FAILED - VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing");
      return;
    }

    setPlug("config", "connected");
    setPlug("redirect", `return URL = ${getReturnUrl()}`);
    setPlug("session", "checking");

    const result = await supabase.auth.getSession();

    if (result.error) {
      setStatus("error");
      setMessage(result.error.message);
      setPlug("session", `FAILED - ${result.error.message}`);
      return;
    }

    const session = result.data.session;

    if (!session || !session.user) {
      setStatus("ready");
      setMessage("Enter your email to receive your CyberCrowd entry link.");
      setPlug("session", "no verified session yet");
      return;
    }

    localStorage.setItem("cc_verified_session", "supabase");
    localStorage.setItem("cc_verified_email", session.user.email || "");
    localStorage.setItem("cc_verified_user_id", session.user.id || "");

    setStatus("verified");
    setMessage("Verified. Opening CyberCrowd dashboard.");
    setPlug("session", `verified session found: ${session.user.email || "user"}`);
    setPlug("room", "opening /dashboard");

    window.setTimeout(() => {
      navigate("/dashboard");
    }, 450);
  }

  async function sendEntryLink() {
    if (!supabase) {
      setStatus("error");
      setMessage("Security gate config is missing.");
      setPlug("email", "blocked - config not connected");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (website.trim()) {
      setStatus("blocked");
      setMessage("Entry request blocked.");
      setPlug("email", "blocked - honeypot field filled");
      return;
    }

    if (!validEmail(cleanEmail)) {
      setStatus("blocked");
      setMessage("Valid email required.");
      setPlug("email", "blocked - invalid email");
      return;
    }

    setStatus("sending");
    setMessage("Sending live CyberCrowd entry link.");
    setPlug("email", "sending magic link request");
    setPlug("redirect", `return URL = ${getReturnUrl()}`);

    localStorage.setItem("cc_pending_email", cleanEmail);
    localStorage.setItem("cc_requested_tier", "visitor");

    const result = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: getReturnUrl(),
        data: {
          cybercrowd_entry: "verify",
          requested_tier: "visitor",
        },
      },
    });

    if (result.error) {
      setStatus("error");
      setMessage(result.error.message);
      setPlug("email", `FAILED - ${result.error.message}`);
      return;
    }

    setStatus("sent");
    setMessage("Check your inbox. One click opens CyberCrowd.");
    setPlug("email", "magic link requested from Supabase");
    setPlug("session", "pending email click");
  }

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-xl rounded-[28px] border border-cyan-400/40 bg-zinc-950/95 p-7 shadow-[0_0_45px_rgba(0,255,255,0.18)]">
        <div className="text-center mb-7">
          <p className="text-xs tracking-[0.35em] text-emerald-300 uppercase mb-3">
            CyberCrowd Verified Entry
          </p>

          <h1 className="text-4xl font-black tracking-[0.18em] text-cyan-300">
            SECURITY GATE
          </h1>

          <p className="mt-5 text-sm leading-7 text-zinc-300">
            Enter your email. CyberCrowd sends one live entry link.
            Click it once and the verified room opens.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-300/40 bg-cyan-400/5 p-4 mb-5">
          <div className="text-xs uppercase tracking-[0.28em] text-emerald-300 mb-2">
            Gate Status
          </div>

          <div className="text-lg font-bold text-white uppercase">
            {status}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.28em] text-emerald-300 mb-2">
              Email
            </span>

            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendEntryLink();
                }
              }}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-cyan-300/30 bg-white/5 px-4 py-4 text-white outline-none focus:border-cyan-300 focus:shadow-[0_0_18px_rgba(0,255,255,0.18)]"
            />
          </label>

          <div className="hidden">
            <label htmlFor="websiteInput">Website</label>
            <input
              id="websiteInput"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            onClick={sendEntryLink}
            disabled={status === "sending" || status === "verified"}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-4 font-black tracking-[0.18em] text-black disabled:opacity-50"
          >
            {status === "sending" ? "SENDING" : "SEND ENTRY LINK"}
          </button>
        </div>

        <div
          className={[
            "mt-5 min-h-8 text-center text-sm tracking-wide",
            status === "error" || status === "blocked"
              ? "text-red-400"
              : "text-emerald-300",
          ].join(" ")}
        >
          {message}
        </div>

        <pre className="mt-5 whitespace-pre-wrap rounded-2xl border border-cyan-300/20 bg-black/50 p-4 text-xs leading-6 text-zinc-400">
{`PLUG TRACE:
config plug: ${plugTrace.config}
email plug: ${plugTrace.email}
redirect plug: ${plugTrace.redirect}
session plug: ${plugTrace.session}
room plug: ${plugTrace.room}`}
        </pre>

        <div className="mt-6 text-center text-[11px] uppercase tracking-[0.25em] text-zinc-500">
          Security only · verified users continue to dashboard
        </div>
      </section>
    </main>
  );
}

export default Verify;
