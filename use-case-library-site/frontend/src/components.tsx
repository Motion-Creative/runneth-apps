import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import { CTA } from "./CTA";
import { Illustration } from "./Illustration";
import { StarRating } from "./Reviews";
import type { RatingSummary, UseCaseMeta } from "./types";
import {
  cardAccent,
  cardTileGradient,
  colors,
  easeArr,
  radius,
} from "./theme";

export const ExperimentalPill = ({
  pulse,
}: {
  pulse?: boolean;
}): JSX.Element => (
  <span
    className={pulse ? "experimental-pill-first-load" : undefined}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: colors.experimentalBg,
      color: colors.experimentalText,
      border: `1px solid ${colors.experimentalBorder}`,
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: 0.2,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: 999,
        background: colors.experimentalText,
      }}
    />
    Experimental
  </span>
);

export const CategoryPill = ({
  title,
  accentHex,
}: {
  title: string;
  accentHex: string;
}): JSX.Element => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      background: accentHex,
      color: colors.textDark,
      fontSize: 11.5,
      fontWeight: 600,
      letterSpacing: 0.2,
    }}
  >
    {title}
  </span>
);

export const FilterChip = ({
  label,
  count,
  active,
  accentHex,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  accentHex?: string;
  onClick: () => void;
}): JSX.Element => {
  const swatch = accentHex ?? colors.textDark;
  const isDarkSwatch = swatch === colors.textDark;
  const activeText = isDarkSwatch ? "#ffffff" : colors.textDark;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      animate={{
        y: active ? -2 : 0,
        boxShadow: active
          ? "0 6px 18px rgba(28, 24, 14, 0.14)"
          : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.22, ease: easeArr as unknown as number[] }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? colors.textDark : colors.border}`,
        background: active ? swatch : "#ffffff",
        color: active ? activeText : colors.textBody,
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
      }}
    >
      {label}
      {typeof count === "number" && (
        <span
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            minWidth: 22,
            height: 18,
            padding: "0 6px",
            borderRadius: 999,
            background: active
              ? isDarkSwatch
                ? "#ffffff"
                : colors.textDark
              : colors.borderSubtle,
            color: active
              ? isDarkSwatch
                ? colors.textDark
                : "#ffffff"
              : colors.textMuted,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
};

export const UseCaseCard = ({
  useCase,
  index,
  rating,
}: {
  useCase: UseCaseMeta;
  index: number;
  rating?: RatingSummary;
}): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const accentHex = cardAccent(useCase.category, useCase.slug);

  const openCard = (): void => {
    navigate({
      pathname: location.pathname,
      search: `?card=${encodeURIComponent(useCase.slug)}`,
    });
  };

  return (
    <motion.div
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 8, opacity: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.03, 0.25),
        ease: easeArr as unknown as number[],
      }}
      whileHover={{
        y: -4,
        boxShadow: `0 18px 40px ${accentHex}26, 0 4px 10px rgba(0,0,0,0.04)`,
      }}
      className="use-case-card"
      style={{
        position: "relative",
        background: "#ffffff",
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: radius.xl,
        padding: 14,
        minHeight: 380,
        display: "flex",
        flexDirection: "column",
        gap: 0,
        boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          aspectRatio: "16 / 10",
          borderRadius: radius.lg,
          border: `1px solid ${accentHex}1f`,
          background: cardTileGradient(accentHex),
          padding: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Illustration slug={useCase.slug} category={useCase.category} accentHex={accentHex} />
      </div>

      <div
        style={{
          padding: "22px 10px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.014em",
            color: colors.textDark,
          }}
        >
          {useCase.display_title}
        </div>
        <div
          style={{ fontSize: 14.5, lineHeight: 1.5, color: colors.textMuted }}
        >
          {useCase.pitch}
        </div>
        {rating && rating.count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <StarRating value={rating.average} size={12} />
            <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>
              {rating.average.toFixed(1)} · {rating.count}
            </span>
          </div>
        )}
        <div style={{ flex: 1 }} />
      </div>

      <button
        type="button"
        onClick={openCard}
        aria-label={`Open ${useCase.display_title}`}
        style={{
          position: "absolute",
          inset: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderRadius: radius.xl,
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 18,
          right: 18,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div className="card-hover-cta" style={{ pointerEvents: "auto" }}>
          <CTA githubPath={useCase.github_path} size="sm" />
        </div>
      </div>
    </motion.div>
  );
};
