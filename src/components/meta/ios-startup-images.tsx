// We need to have one defined for each resolution at https://www.ios-resolution.com/

import { getUserAgent } from "@/lib/headers";
import Bowser from "bowser";

export const IOSStartupImages = () => {
  const userAgent = getUserAgent();
  const browser = Bowser.getParser(userAgent);
  const safari = browser.getBrowserName() === "Safari";

  return (
    safari && (
      <>
        {resolutions.map((res, index) => (
          <link
            key={index}
            rel="apple-touch-startup-image"
            media={`(device-width: ${
              res.width / res.pixelRatio
            }px) and (device-height: ${
              res.height / res.pixelRatio
            }px) and (-webkit-device-pixel-ratio: ${res.pixelRatio})`}
            href={`/startup-image/${res.width}x${res.height}.png`}
          />
        ))}
      </>
    )
  );
};

// // Pulled from https://www.ios-resolution.com/
const resolutions = [
  { width: 1125, height: 2436, pixelRatio: 3 }, // iPhone X, iPhone XS, iPhone 11 Pro, iPhone 12 Mini, iPhone 13 Mini
  { width: 1170, height: 2532, pixelRatio: 3 }, // iPhone 12, iPhone 12 Pro, iPhone 13, iPhone 13 Pro
  { width: 1242, height: 2688, pixelRatio: 3 }, // iPhone XS Max, iPhone 11 Pro Max
  { width: 1284, height: 2778, pixelRatio: 3 }, // iPhone 12 Pro Max, iPhone 13 Pro Max
  { width: 750, height: 1334, pixelRatio: 2 }, // iPhone 6, iPhone 6S, iPhone 7, iPhone 8, iPhone SE 2nd Gen
  { width: 640, height: 1136, pixelRatio: 2 }, // iPhone 5, iPhone 5S, iPhone 5C, iPhone SE 1st Gen
  { width: 1536, height: 2048, pixelRatio: 2 }, // iPads
  { width: 1668, height: 2224, pixelRatio: 2 }, // iPad Pro 10.5"
  { width: 1668, height: 2388, pixelRatio: 2 }, // iPad Pro 11"
  { width: 2048, height: 2732, pixelRatio: 2 }, // iPad Pro 12.9"
  { width: 1290, height: 2796, pixelRatio: 3 }, // iPhone 15 Pro Max
  { width: 1179, height: 2556, pixelRatio: 3 }, // iPhone 15 Pro
  { width: 1290, height: 2796, pixelRatio: 3 }, // iPhone 15 Plus
  { width: 1179, height: 2556, pixelRatio: 3 }, // iPhone 15
  { width: 410, height: 502, pixelRatio: 2 }, // Apple Watch Ultra 2
  { width: 396, height: 484, pixelRatio: 2 }, // Apple Watch Series 9 Large
  { width: 352, height: 430, pixelRatio: 2 }, // Apple Watch Series 9 Small
  { width: 2048, height: 2732, pixelRatio: 2 }, // iPad Pro (6th gen 12.9")
  { width: 1668, height: 2388, pixelRatio: 2 }, // iPad Pro (6th gen 11")
  { width: 1640, height: 2360, pixelRatio: 2 }, // iPad 10th gen
  { width: 1284, height: 2778, pixelRatio: 3 }, // iPhone 14 Plus
  { width: 410, height: 502, pixelRatio: 2 }, // Apple Watch Ultra
  { width: 1290, height: 2796, pixelRatio: 3 }, // iPhone 14 Pro Max
  { width: 1179, height: 2556, pixelRatio: 3 }, // iPhone 14 Pro
  { width: 1170, height: 2532, pixelRatio: 3 }, // iPhone 14
  { width: 396, height: 484, pixelRatio: 2 }, // Apple Watch Series 8 Large
  { width: 352, height: 430, pixelRatio: 2 }, // Apple Watch Series 8 Small
  { width: 368, height: 448, pixelRatio: 2 }, // Apple Watch SE (2nd) Large
  { width: 324, height: 394, pixelRatio: 2 }, // Apple Watch SE (2nd) Small
  { width: 750, height: 1334, pixelRatio: 2 }, // iPhone SE 3rd gen
  { width: 1640, height: 2360, pixelRatio: 2 }, // iPad Air (5th gen)
  { width: 396, height: 484, pixelRatio: 2 }, // Apple Watch Series 7 Large
  { width: 352, height: 430, pixelRatio: 2 }, // Apple Watch Series 7 Small
  { width: 1488, height: 2266, pixelRatio: 2 }, // iPad Mini (6th gen)
  { width: 1170, height: 2532, pixelRatio: 3 }, // iPhone 13
  { width: 1080, height: 2340, pixelRatio: 3 }, // iPhone 13 mini
  { width: 1284, height: 2778, pixelRatio: 3 }, // iPhone 13 Pro Max
  { width: 1170, height: 2532, pixelRatio: 3 }, // iPhone 13 Pro
  { width: 1620, height: 2160, pixelRatio: 2 }, // iPad 9th gen
  { width: 2048, height: 2732, pixelRatio: 2 }, // iPad Pro (5th gen 12.9")
  { width: 1668, height: 2388, pixelRatio: 2 }, // iPad Pro (5th gen 11")
  { width: 1640, height: 2360, pixelRatio: 2 }, // iPad Air (4th gen)
  { width: 1170, height: 2532, pixelRatio: 3 }, // iPhone 12
  { width: 1080, height: 2340, pixelRatio: 3 }, // iPhone 12 mini
  { width: 1284, height: 2778, pixelRatio: 3 }, // iPhone 12 Pro Max
  { width: 1170, height: 2532, pixelRatio: 3 }, // iPhone 12 Pro
  { width: 1620, height: 2160, pixelRatio: 2 }, // iPad 8th gen
  { width: 368, height: 448, pixelRatio: 2 }, // Apple Watch Series 6 Large
  { width: 324, height: 394, pixelRatio: 2 }, // Apple Watch Series 6 Small
  { width: 368, height: 448, pixelRatio: 2 }, // Apple Watch SE (1st) Large
  { width: 324, height: 394, pixelRatio: 2 }, // Apple Watch SE (1st) Small
  { width: 750, height: 1334, pixelRatio: 2 }, // iPhone SE 2nd gen
  { width: 2048, height: 2732, pixelRatio: 2 }, // iPad Pro (4th gen 12.9")
  { width: 1668, height: 2388, pixelRatio: 2 }, // iPad Pro (4th gen 11")
  { width: 1620, height: 2160, pixelRatio: 2 }, // iPad 7th gen
  { width: 1242, height: 2688, pixelRatio: 3 }, // iPhone 11 Pro Max
  { width: 1242, height: 2688, pixelRatio: 3 }, // iPhone 11 Pro
  { width: 828, height: 1792, pixelRatio: 2 }, // iPhone 11
  { width: 368, height: 448, pixelRatio: 2 }, // Apple Watch Series 5 Large
  { width: 324, height: 394, pixelRatio: 2 }, // Apple Watch Series 5 Small
  { width: 640, height: 1136, pixelRatio: 2 }, // iPod touch 7th gen
  { width: 1536, height: 2048, pixelRatio: 2 }, // iPad Mini (5th gen)
  { width: 1668, height: 2224, pixelRatio: 2 }, // iPad Air (3rd gen)
  { width: 2048, height: 2732, pixelRatio: 2 }, // iPad Pro (3rd gen 12.9")
  { width: 1668, height: 2388, pixelRatio: 2 }, // iPad Pro (3rd gen 11")
  { width: 828, height: 1792, pixelRatio: 2 }, // iPhone XR
  { width: 1242, height: 2688, pixelRatio: 3 }, // iPhone XS Max
  { width: 1125, height: 2436, pixelRatio: 3 }, // iPhone XS
  { width: 368, height: 448, pixelRatio: 2 }, // Apple Watch Series 4 Large
  { width: 324, height: 394, pixelRatio: 2 }, // Apple Watch Series 4 Small
  { width: 1080, height: 1920, pixelRatio: 3 }, // iPhone 6 Plus
  { width: 750, height: 1334, pixelRatio: 2 }, // iPhone 6
  { width: 1136, height: 640, pixelRatio: 2 }, // iPhone 5C
  { width: 1136, height: 640, pixelRatio: 2 }, // iPhone 5S
  { width: 768, height: 1024, pixelRatio: 2 }, // iPad 4th gen
  { width: 768, height: 1024, pixelRatio: 2 }, // iPad mini
  { width: 640, height: 960, pixelRatio: 2 }, // iPod touch 5th gen
  { width: 1136, height: 640, pixelRatio: 2 }, // iPhone 5
  { width: 768, height: 1024, pixelRatio: 2 }, // iPad 3rd gen
  { width: 640, height: 960, pixelRatio: 2 }, // iPhone 4S
  { width: 768, height: 1024, pixelRatio: 2 }, // iPad 2
  { width: 640, height: 960, pixelRatio: 2 }, // iPod touch 4th gen
  { width: 960, height: 640, pixelRatio: 2 }, // iPhone 4
  { width: 768, height: 1024, pixelRatio: 2 }, // iPad 1st gen
  { width: 320, height: 480, pixelRatio: 2 }, // iPod touch 3rd gen
  { width: 320, height: 480, pixelRatio: 2 }, // iPhone 3GS
  { width: 320, height: 480, pixelRatio: 2 }, // iPod touch 2nd gen
  { width: 320, height: 480, pixelRatio: 2 }, // iPhone 3G
  { width: 320, height: 480, pixelRatio: 2 }, // iPod touch 1st gen
  { width: 320, height: 480, pixelRatio: 2 }, // iPhone 1st gen
];
