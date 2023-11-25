import { nanoid } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { actorMap } from "./shared";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
// export default authMiddleware({
//   publicRoutes: ["/", "/craft", "/recipe/*.*)"],
// });

// export const config = {
//   matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
// };

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
// export function middleware(request: NextRequest) {
//   return NextResponse.redirect(new URL("/home", request.url));
// }

// See "Matching Paths" below to learn more

// export const config = {
//   matcher: ["/about/:path*", "/dashboard/:path*"],
// };

const JwtTokenSchema = z.string();

export function middleware(request: NextRequest) {
  let actorId = request.cookies.get("actorId")?.value;
  // // todo swap actorId with actorToken and use jst
  // // problem with jsonwebtoken/crypto in edge runtime
  // const actorIdParseResult = JwtTokenSchema.safeParse(
  //   request.cookies.get("actorId")
  // );

  // let actorId: string;
  if (!actorId || !actorMap.has(actorId)) {
    actorId = nanoid();
    request.cookies.set("actorId", actorId);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-actor-id", actorId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set("actorId", actorId);
  return response;
}

// Example sessToken from clerk
// {
//     "sessToken": {
//       "azp": "http://localhost:3000",
//       "exp": 1687906422,
//       "iat": 1687906362,
//       "iss": "https://magical-marmoset-51.clerk.accounts.dev",
//       "nbf": 1687906352,
//       "sid": "sess_2Ro7e2IxrffdqBboq8KfB6eGbIy",
//       "sub": "user_2RfWKJREkjKbHZy0Wqa5qrHeAnb"
//     }
//   }

// export default async function (req: NextApiRequest, res: NextApiResponse) {
//     const publicKey = process.env.CLERK_PEM_PUBLIC_KEY;
//     const cookies = new Cookies(req, res);
//     const sessToken = cookies.get("__session");
//     const token = req.headers.authorization;
//     if (sessToken === undefined && token === undefined) {
//       res.status(401).json({ error: "not signed in" });
//       return;
//     }
//     try {
//       let decoded = "";
//       if (token) {
//         decoded = jwt.verify(token, publicKey);
//         res.status(200).json({ sessToken: decoded });
//         return;
//       } else {
//         decoded = jwt.verify(sessToken, publicKey);
//         res.status(200).json({ sessToken: decoded });
//         return;
//       }
//     } catch (error) {
//       res.status(400).json({
//         error: "Invalid Token",
//       });
//       return;
//     }
//   }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     "/((?!api|_next/static|_next/image|favicon.ico).*)",
//   ],
// };

// Good to know: The matcher values need to be constants so they can be
// statically analyzed at build-time. Dynamic values such as variables will be ignored.

// EXAMPLE of conditional statement from nextjs docs

// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   if (request.nextUrl.pathname.startsWith('/about')) {
//     return NextResponse.rewrite(new URL('/about-2', request.url))
//   }

//   if (request.nextUrl.pathname.startsWith('/dashboard')) {
//     return NextResponse.rewrite(new URL('/dashboard/user', request.url))
//   }
// }

// EXAMPLE using cookies

// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function middleware(request: NextRequest) {
//   // Assume a "Cookie:nextjs=fast" header to be present on the incoming request
//   // Getting cookies from the request using the `RequestCookies` API
//   let cookie = request.cookies.get('nextjs')
//   console.log(cookie) // => { name: 'nextjs', value: 'fast', Path: '/' }
//   const allCookies = request.cookies.getAll()
//   console.log(allCookies) // => [{ name: 'nextjs', value: 'fast' }]

//   request.cookies.has('nextjs') // => true
//   request.cookies.delete('nextjs')
//   request.cookies.has('nextjs') // => false

//   // Setting cookies on the response using the `ResponseCookies` API
//   const response = NextResponse.next()
//   response.cookies.set('vercel', 'fast')
//   response.cookies.set({
//     name: 'vercel',
//     value: 'fast',
//     path: '/',
//   })
//   cookie = response.cookies.get('vercel')
//   console.log(cookie) // => { name: 'vercel', value: 'fast', Path: '/' }
//   // The outgoing response will have a `Set-Cookie:vercel=fast;path=/test` header.

//   return response
// }
