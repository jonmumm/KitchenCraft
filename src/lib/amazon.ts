export const getAffiliatelink = (asin: string) => {
  return `https://www.amazon.com/dp/${asin}/ref=nosim?tag=kitchencraftai-20`;
};

export const getAmazonImageUrl = (asin: string) => {
  return `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=US&ASIN=${asin}&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_`;
};
