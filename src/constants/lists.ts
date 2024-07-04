export const defaultLists = [
  {
    icon: "👍",
    slug: "liked",
    public: false,
  },
  {
    icon: "⏰",
    slug: "make-later",
    public: false,
  },
  {
    icon: "⭐️",
    slug: "favorites",
    public: true,
  },
  {
    icon: "💬",
    slug: "commented",
    public: true,
  },
];

export const defaultListsBySlug = defaultLists.reduce(
  (obj, item) => {
    obj[item.slug] = item;
    return obj;
  },
  {} as Record<string, (typeof defaultLists)[0]>
);
