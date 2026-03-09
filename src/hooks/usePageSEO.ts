import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export function usePageSEO({ title, description, image, url }: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes("Traviso") ? title : `${title} | Traviso AI`;
    document.title = fullTitle;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (property.startsWith("og:") || property.startsWith("twitter:")) {
          el.setAttribute("property", property);
        } else {
          el.setAttribute("name", property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description);
      setMeta("twitter:description", description);
    }

    setMeta("og:title", fullTitle);
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:card", "summary_large_image");

    if (image) {
      setMeta("og:image", image);
      setMeta("twitter:image", image);
    }

    if (url) {
      setMeta("og:url", url);
    }

    return () => {
      document.title = "Traviso AI — Travel Like Your Favorite Creator";
    };
  }, [title, description, image, url]);
}
