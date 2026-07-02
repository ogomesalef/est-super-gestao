"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 639px)";
const TABLET_QUERY = "(max-width: 1023px)";

export function useMediaQuery(query: string, defaultValue = false) {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}

export function useIsBelowLg() {
  return useMediaQuery(TABLET_QUERY);
}
