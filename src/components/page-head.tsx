"use client";

import { useEffect } from "react";

interface PageHeadProps {
  title: string;
  description: string;
  canonical?: string;
}

const SITE_URL = "https://bullbrief.vercel.app";

export function PageHead({ title, description, canonical }: PageHeadProps) {
  useEffect(() => {
    const fullTitle = `${title} | BullBrief`;
    document.title = fullTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    } else {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      metaDesc.setAttribute("content", description);
      document.head.appendChild(metaDesc);
    }

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", fullTitle);
    }

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute("content", description);
    }

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute("content", fullTitle);
    }

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) {
      twitterDesc.setAttribute("content", description);
    }

    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute("href", canonical);
      } else {
        canonicalLink = document.createElement("link");
        canonicalLink.setAttribute("rel", "canonical");
        canonicalLink.setAttribute("href", canonical);
        document.head.appendChild(canonicalLink);
      }
    }
  }, [title, description, canonical]);

  return null;
}
