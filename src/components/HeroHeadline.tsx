import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

const TAIL_COUNT = 6;

export function HeroHeadline() {
  const { t } = useI18n();
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setFade(false);
      window.setTimeout(() => {
        setIdx((i) => (i + 1) % TAIL_COUNT);
        setFade(true);
      }, 220);
    }, 3200);
    return () => window.clearInterval(tick);
  }, []);

  const prefix = t("heroPrefix");
  const tail = t(`heroTail.${idx}`);
  const full = `${prefix} ${tail}`;

  return (
    <h1 aria-label={full}>
      {prefix}{" "}
      <span className={`hero-tail ${fade ? "is-in" : "is-out"}`}>{tail}</span>
    </h1>
  );
}
