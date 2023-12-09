// We need to have one defined for each resolution at https://www.ios-resolution.com/

export const AppleStartupImages = () => {
  return (
    <>
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        href="/apple-launch-1125x2436.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        href="/apple-launch-750x1334.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        href="/apple-launch-1242x2208.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        href="/apple-launch-640x1136.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
        href="/apple-launch-1536x2048.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
        href="/apple-launch-1668x2224.png"
      />
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        href="/apple-launch-1179x2556.png"
      ></link>
      {/* iPhone 15 Pro and iPhone 15 */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        href="/apple-launch-2048x2732.png"
      />
      {/* iPhone 14 and iPhone 14 Pro */}
      <link
        rel="apple-touch-startup-image"
        media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        href="/apple-launch-1170x2532.png"
      />
    </>
  );
};
