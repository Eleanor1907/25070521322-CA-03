// hooks/useDebounce.js
// Returns `value` only after the user stops typing for `delay` ms.
// Used by the search box so we don't call the API on every keystroke.

import { useEffect, useState } from "react";

export default function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
