import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createBrowserSessionToken,
  createCallerToken,
  getBrowserSessionTokenFromCookie,
  getGuestTokenFromCookies,
  parseAppInstallToken,
  parsedBrowserSessionTokenFromCookie,
  setGuestTokenCookieHeader,
  setSessionTokenCookieHeader,
} from "./lib/browser-session";
import { CallerSchema } from "./schema";

export async function middleware(request: NextRequest) {
  const appInstallToken = request.nextUrl.searchParams.get("token");
  const result = extractAndValidateHeaders(request.headers);
  console.log(result);

  // const headers = extractAndValidateHeaders(request.headers);
  // console.log(headers);

  let newGuestToken: string | undefined;
  let newBrowserSessionToken: string | undefined;
  let uniqueId;
  // let uniqueIdType: UniqueIdType | undefined;
  if (appInstallToken) {
    let appInstall;
    try {
      appInstall = await parseAppInstallToken(appInstallToken);
    } catch (ex) {
      // If expired, do nothing
    }
    if (appInstall && !appInstall.email && appInstall.distinctId) {
      uniqueId = appInstall.distinctId;
      newGuestToken = await createCallerToken(appInstall.distinctId, "guest");
    }
  }

  if (!uniqueId) {
    const guestToken = await getGuestTokenFromCookies();
    let caller = guestToken?.jti;

    if (caller) {
      const callerParse = CallerSchema.safeParse(caller);
      if (callerParse.success && callerParse.data.type === "guest") {
        uniqueId = callerParse.data.id;
      }
    }

    if (!uniqueId) {
      const id = uuidv4();
      const callerToken = await createCallerToken(id, "guest");
      newGuestToken = callerToken;
      uniqueId = id;
    }
  }

  const requestHeaders = new Headers(request.headers);

  const browserSessionToken = await getBrowserSessionTokenFromCookie();
  const parsedBrowserSessionToken = await parsedBrowserSessionTokenFromCookie();
  if (browserSessionToken && parsedBrowserSessionToken) {
    requestHeaders.set("x-browser-session-id", parsedBrowserSessionToken.jti);
    requestHeaders.set("x-browser-session-token", browserSessionToken);
  } else {
    const browserSessionId = uuidv4();
    newBrowserSessionToken = await createBrowserSessionToken(browserSessionId);
    requestHeaders.set("x-browser-session-id", browserSessionId);
    requestHeaders.set("x-browser-session-token", newBrowserSessionToken);
  }

  const pageSessionId = uuidv4();

  // todo only do this if actually a guest?
  requestHeaders.set("x-guest-id", uniqueId);
  requestHeaders.set("x-page-session-id", pageSessionId);
  requestHeaders.set("x-url", request.url);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (newBrowserSessionToken) {
    await setSessionTokenCookieHeader(res, newBrowserSessionToken);
  }

  if (newGuestToken) {
    await setGuestTokenCookieHeader(res, newGuestToken);
  }

  return res;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
// Define a schema for IP location data
const IPLocationSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Define a schema for the headers we want to extract and validate
const HeadersSchema = z.object({
  continent: z.enum(["AF", "AN", "AS", "EU", "NA", "OC", "SA"]).optional(),
  country: z.string().length(2).optional(),
  region: z.string().max(3).optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  signature: z.string().optional(),
  gps: IPLocationSchema.optional(),
});

// Type definition for the headers context
type HeadersContext = {
  continent?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  signature?: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
};

// Function to extract and validate headers from a request with a .get() method
function extractAndValidateHeaders(headers: NextRequest["headers"]) {
  // Extract headers and convert them into a structured object
  const headersToValidate: HeadersContext = {
    continent: headers.get("x-vercel-ip-continent") || undefined,
    country: headers.get("x-vercel-ip-country") || undefined,
    region: headers.get("x-vercel-ip-country-region") || undefined,
    city: headers.get("x-vercel-ip-city") || undefined,
    timezone: headers.get("x-vercel-ip-timezone") || undefined,
    signature: headers.get("x-vercel-signature") || undefined,
    gps: {
      latitude: parseFloat(headers.get("x-vercel-ip-latitude") || "0"),
      longitude: parseFloat(headers.get("x-vercel-ip-longitude") || "0"),
    },
  };

  // Validate the structured object using the Zod schema
  const result = HeadersSchema.safeParse(headersToValidate);

  if (result.success) {
    return result.data;
  } else {
    console.error("Validation failed:", result.error);
    return undefined;
  }
}
