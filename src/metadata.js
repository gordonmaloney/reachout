import metaImage from "./assets/meta.jpeg";

export const siteMetadata = {
  main: {
    title: "REACHOUT | Phone- and text-banking",
    description:
      "Build a phonebank, send it to your phone, and work through calls and messages contact by contact.",
    image: metaImage,
    urlPath: "/",
  },
  share: {
    title: "REACHOUT | Phonebank share link",
    description:
      "Open this REACHOUT phonebank on your phone to start calling and messaging contacts.",
    image: metaImage,
    urlPath: "/s",
  },
};

export function getMetadataForPath(pathname = window.location.pathname) {
  return pathname.replace(/\/+$/, "") === "/s"
    ? siteMetadata.share
    : siteMetadata.main;
}

function setMeta(selector, attribute, value) {
  const element = document.head.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
}

export function applyMetadata(metadata = getMetadataForPath()) {
  const absoluteUrl = new URL(metadata.urlPath, window.location.origin).href;
  const absoluteImageUrl = new URL(metadata.image, window.location.origin).href;

  document.title = metadata.title;
  setMeta('meta[name="description"]', "content", metadata.description);
  setMeta('meta[property="og:title"]', "content", metadata.title);
  setMeta('meta[property="og:description"]', "content", metadata.description);
  setMeta('meta[property="og:url"]', "content", absoluteUrl);
  setMeta('meta[property="og:image"]', "content", absoluteImageUrl);
  setMeta('meta[name="twitter:title"]', "content", metadata.title);
  setMeta('meta[name="twitter:description"]', "content", metadata.description);
  setMeta('meta[name="twitter:image"]', "content", absoluteImageUrl);
}
