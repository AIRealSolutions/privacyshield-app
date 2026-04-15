/**
 * Google OAuth 2.0 Authentication Routes
 * Handles /api/oauth/google and /api/oauth/google/callback
 */
import { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import { upsertUser, getUserByOpenId } from "./db";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

function getGoogleClient(redirectUri: string) {
  return new OAuth2Client(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}

function getRedirectUri(req: Request): string {
  const origin = (req.headers.origin as string) || `${req.protocol}://${req.headers.host}`;
  return `${origin}/api/oauth/google/callback`;
}

export function registerGoogleAuthRoutes(app: Express) {
  // ─── Step 1: Redirect to Google ─────────────────────────────────────────────
  app.get("/api/oauth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(503).json({ error: "Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." });
      return;
    }

    const redirectUri = getRedirectUri(req);
    const client = getGoogleClient(redirectUri);

    // Encode the frontend origin in state so callback can redirect back correctly
    const state = Buffer.from(
      JSON.stringify({ origin: req.headers.origin || `${req.protocol}://${req.headers.host}`, returnPath: req.query.returnPath || "/" })
    ).toString("base64url");

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account",
    });

    res.redirect(authUrl);
  });

  // ─── Step 2: Handle Google Callback ─────────────────────────────────────────
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;

    // Decode state to get frontend origin
    let origin = `${req.protocol}://${req.headers.host}`;
    let returnPath = "/dashboard";
    try {
      if (state) {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        if (decoded.origin) origin = decoded.origin;
        if (decoded.returnPath) returnPath = decoded.returnPath;
      }
    } catch {
      // Use defaults
    }

    if (error) {
      console.error("[Google OAuth] Error from Google:", error);
      res.redirect(`${origin}/login?error=google_oauth_failed`);
      return;
    }

    if (!code) {
      res.redirect(`${origin}/login?error=missing_code`);
      return;
    }

    try {
      const redirectUri = getRedirectUri(req);
      const client = getGoogleClient(redirectUri);

      // Exchange code for tokens
      const { tokens } = await client.getToken(code);
      client.setCredentials(tokens);

      // Verify the ID token and get user info
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: ENV.googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        res.redirect(`${origin}/login?error=invalid_token`);
        return;
      }

      // Use Google's sub (subject) as the openId, prefixed to avoid collision with Manus IDs
      const openId = `google:${payload.sub}`;
      const email = payload.email ?? undefined;
      const name = payload.name ?? payload.email ?? "Google User";

      // Upsert user in database
      await upsertUser({
        openId,
        name,
        email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Fetch the full user record to get the DB id
      const user = await getUserByOpenId(openId);
      if (!user) {
        res.redirect(`${origin}/login?error=user_not_found`);
        return;
      }

      // Create a JWT session cookie (same format as Manus OAuth)
      const secret = new TextEncoder().encode(ENV.cookieSecret || "fallback-secret-change-me");
      const token = await new SignJWT({
        sub: openId,
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        loginMethod: "google",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secret);

      // Set the session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);

      // Redirect back to the frontend dashboard
      res.redirect(`${origin}${returnPath}`);
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect(`${origin}/login?error=google_auth_error`);
    }
  });
}
