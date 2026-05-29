import createUser from "./create-user";
import sendVerification from "./send-verification";
import verifyGet from "./verify-get";
import verifyPost from "./verify";
import emailFn from "../functions/email";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/create-user") {
      return createUser.fetch(request, env, ctx);
    }

    if (path === "/send-verification") {
      return sendVerification.fetch(request, env, ctx);
    }

    if (path === "/verify-get") {
      return verifyGet.fetch(request, env, ctx);
    }

    if (path === "/verify") {
      return verifyPost.fetch(request, env, ctx);
    }

    if (path === "/email") {
      return emailFn.fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  }
};
