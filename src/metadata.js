const SITE_URL = "https://ta-reachout.netlify.app/";
const META_IMAGE_URL = new URL("meta.jpg", SITE_URL).href;

export const siteMetadata = {
  main: {
    title: "REACHOUT | Phone- and text-banking",
    description:
      "Easily phone and message contacts to build for meetings, mobilisations, actions and more.",
    image: META_IMAGE_URL,
    urlPath: "/",
  },
  share: {
    title: "REACHOUT | Phone- and text-banking",
    description:
      "Open this REACHOUT phonebank on your phone to start calling and messaging contacts.",
    image: META_IMAGE_URL,
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
  setMeta('meta[property="og:image:secure_url"]', "content", absoluteImageUrl);
  setMeta('meta[name="twitter:title"]', "content", metadata.title);
  setMeta('meta[name="twitter:description"]', "content", metadata.description);
  setMeta('meta[name="twitter:image"]', "content", absoluteImageUrl);
}
