import type { CSSProperties, ReactElement } from "react";

import { accentIconColor, cardAccent } from "./theme";

import apiConnectionFilled from "./icons/api-connection-filled.svg?raw";
import arrowRotateClockwiseFilled from "./icons/arrow-rotate-clockwise-filled.svg?raw";
import brainFilled from "./icons/brain-filled.svg?raw";
import checkCircleFilled from "./icons/check-circle-filled.svg?raw";
import cloudDownloadFilled from "./icons/cloud-download-filled.svg?raw";
import colorPaletteFilled from "./icons/color-palette-filled.svg?raw";
import fileChartFilled from "./icons/file-chart-filled.svg?raw";
import foldersFilled from "./icons/folders-filled.svg?raw";
import importFilled from "./icons/import-filled.svg?raw";
import layoutDashboardFilled from "./icons/layout-dashboard-filled.svg?raw";
import layoutGridFilled from "./icons/layout-grid-filled.svg?raw";
import lockFilled from "./icons/lock-filled.svg?raw";
import magicBookFilled from "./icons/magic-book-filled.svg?raw";
import shieldCheckFilled from "./icons/shield-check-filled.svg?raw";
import splitFilled from "./icons/split-filled.svg?raw";
import starFilled from "./icons/star-filled.svg?raw";
import storageFilled from "./icons/storage-filled.svg?raw";
import binocularsFilled from "./icons/binoculars-filled.svg?raw";
import targetFilled from "./icons/target-filled.svg?raw";

const ICON_BY_SLUG: Record<string, string> = {
  "team-member-memory": brainFilled,
  "plan-mode": checkCircleFilled,
  "self-iteration-loop": arrowRotateClockwiseFilled,
  "share-use-case": cloudDownloadFilled,
  "routine-storage-audit": storageFilled,
  "authenticate-apps": lockFilled,
  bootcamp: magicBookFilled,
  "review-library": starFilled,
  "static-ad-gen": layoutGridFilled,
  "brand-kit": colorPaletteFilled,
  "landing-page-experiments": splitFilled,
  "landing-page-summary": fileChartFilled,
  "optimize-landing-page": targetFilled,
  "building-integrations": apiConnectionFilled,
  "integration-capabilities-library": foldersFilled,
  "add-roles-permissions": shieldCheckFilled,
  "context-import": importFilled,
  "competitor-watch": binocularsFilled,
};

const iconWrapStyle = (tint: string): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 64,
  height: 64,
  color: `${tint}99`,
  mixBlendMode: "multiply",
});

const inlineSvgStyle =
  "display:block;width:100%;height:100%;max-width:80px;max-height:80px";

const RunnethIcon = ({
  svg,
  accentHex,
}: {
  svg: string;
  accentHex: string;
}): ReactElement => (
  <span
    style={iconWrapStyle(accentIconColor(accentHex))}
    aria-hidden
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: svg.replace("<svg ", `<svg style="${inlineSvgStyle}" `),
    }}
  />
);

export const Illustration = ({
  slug,
  category,
  accentHex,
}: {
  slug: string;
  category?: string;
  accentHex?: string;
}): ReactElement => {
  const svg = ICON_BY_SLUG[slug] ?? layoutDashboardFilled;
  const tileAccent = accentHex ?? cardAccent(category, slug);
  return <RunnethIcon svg={svg} accentHex={tileAccent} />;
};
