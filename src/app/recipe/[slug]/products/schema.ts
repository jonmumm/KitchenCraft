import { z } from "zod";

const MetaTagSchema = z
  .object({
    themeColor: z.string().optional(),
    viewport: z.string().optional(),
    encryptedSlateToken: z.string().optional(),
    ogImage: z.string().optional(),
    ogTitle: z.string().optional(),
    ogUrl: z.string().optional(),
    ogDescription: z.string().optional(),
    title: z.string().optional(),
    // Add other meta tags as needed
  })
  .optional();

const CseImageSchema = z
  .object({
    src: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  })
  .optional();

const CseThumbnailSchema = z
  .object({
    src: z.string(),
    width: z.string().optional(),
    height: z.string().optional(),
  })
  .optional();

const ScrapedSchema = z
  .object({
    image_link: z.string().optional(),
  })
  .optional();

const PageMapSchema = z
  .object({
    metatags: z.array(MetaTagSchema).optional(),
    cse_image: z.array(CseImageSchema).optional(),
    cse_thumbnail: z.array(CseThumbnailSchema).optional(),
    scraped: z.array(ScrapedSchema).optional(),
  })
  .optional();

const ItemSchema = z.object({
  kind: z.string(),
  title: z.string(),
  htmlTitle: z.string(),
  link: z.string(),
  displayLink: z.string(),
  snippet: z.string(),
  htmlSnippet: z.string(),
  cacheId: z.string().optional(),
  formattedUrl: z.string(),
  htmlFormattedUrl: z.string(),
  pagemap: PageMapSchema.optional(),
});

const QuerySchema = z.object({
  title: z.string(),
  totalResults: z.string(),
  searchTerms: z.string(),
  count: z.number(),
  startIndex: z.number(),
  inputEncoding: z.string(),
  outputEncoding: z.string(),
  safe: z.string(),
  cx: z.string(),
});

export const GoogleCustomSearchResponseSchema = z.object({
  kind: z.string(),
  url: z.object({
    type: z.string(),
    template: z.string(),
  }),
  queries: z.object({
    request: z.array(QuerySchema),
    nextPage: z.array(QuerySchema).optional(),
  }),
  context: z.object({
    title: z.string(),
  }),
  searchInformation: z.object({
    searchTime: z.number(),
    formattedSearchTime: z.string(),
    totalResults: z.string(),
    formattedTotalResults: z.string(),
  }),
  items: z.array(ItemSchema).optional(),
});
