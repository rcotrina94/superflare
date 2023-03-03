import {
  createRequestHandler,
  createCookieSessionStorage,
} from "@remix-run/cloudflare";
import config from "../superflare.config";

import * as build from "../build";
import { handleFetch } from "superflare";

let remixHandler: ReturnType<typeof createRequestHandler>;

export const onRequest: PagesFunction<Env> = async (ctx) => {
  if (!remixHandler) {
    remixHandler = createRequestHandler(
      build as any,
      ctx.env.CF_PAGES ? "production" : "development"
    );
  }

  const sessionStorage = createCookieSessionStorage({
    cookie: {
      httpOnly: true,
      path: "/",
      secure: Boolean(ctx.request.url.match(/^(http|ws)s:\/\//)),
      secrets: [ctx.env.SESSION_SECRET],
    },
  });

  const session = await sessionStorage.getSession(
    ctx.request.headers.get("Cookie")
  );

  return handleFetch(
    {
      config: config({
        request: ctx.request,
        env: ctx.env,
        ctx,
      }),
      session,
      getSessionCookie: () => sessionStorage.commitSession(session),
    },
    () => remixHandler(ctx.request)
  );
};
