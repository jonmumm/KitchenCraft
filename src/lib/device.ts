export const getFeatures = (_ua: string) => {
  const { isInPWA, isChrome, isIOSSafari } = getPlatformInfo(_ua);
  // const hasPush = hasPushManager && ((isIOSSafari && isInPWA) || isChromium);
  // const hasPushManager = features.has;
  // 'serviceWorker' in navigator && 'PushManager' in window;
  const hasServiceWorker = ("serviceWorker" in navigator) as
    | boolean
    | undefined;
  const hasPushManager = "PushManager" in window;

  const hasPush = hasPushManager && ((isIOSSafari && isInPWA) || isChrome);
  const canInstall = isChrome || isIOSSafari;

  return {
    hasServiceWorker,
    hasPush,
    canInstall,
  };
};

export const getPlatformInfo = (_ua: string) => {
  const isIDevice = /iPad|iPhone|iPod/.test(_ua);
  const isSamsung = /Samsung/i.test(_ua);
  let isFireFox = /Firefox/i.test(_ua);
  let isOpera = /opr/i.test(_ua);
  const isEdge = /edg/i.test(_ua);

  // Opera & FireFox only Trigger on Android
  isFireFox = /android/i.test(_ua);

  if (isOpera) {
    isOpera = /android/i.test(_ua);
  }

  const isChrome = /chrome/i.test(_ua);
  const isInPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches;
  const isIOSChrome = isIDevice && _ua.indexOf("CriOS") > -1;
  const isIOSFirefox = isIDevice && _ua.indexOf("FxiOS") > -1 && !isIOSChrome;
  const isIOSSafari =
    isIDevice && _ua.indexOf("Safari") > -1 && !isIOSChrome && !isIOSFirefox;
  const isUnsupported = false; // todo how do we detect webview
  const isiPad = isIOSSafari && _ua.indexOf("iPad") > -1;
  const isiPhone = isIOSSafari && _ua.indexOf("iPad") === -1;

  return {
    isUnsupported,
    isIOSSafari,
    isiPad,
    isiPhone,
    isChrome,
    isEdge,
    isIOSFirefox,
    isIOSChrome,
    isSamsung,
    isFireFox,
    isOpera,
    isIDevice,
    isInPWA,
  };
};
