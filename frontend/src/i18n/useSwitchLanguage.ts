import { useNavigate, useLocation } from "react-router-dom";
import { LANG_STORAGE_KEY, type Lang, isLang } from "./constants";

/** Switch locale in URL (and persist). URL overrides storage on next load. */
export function useSwitchLanguage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (next: Lang) => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length > 0 && isLang(parts[0])) {
      parts[0] = next;
    } else {
      parts.unshift(next);
    }
    localStorage.setItem(LANG_STORAGE_KEY, next);
    navigate(
      {
        pathname: "/" + parts.join("/"),
        search: location.search,
        hash: location.hash,
      },
      { replace: true }
    );
  };
}
