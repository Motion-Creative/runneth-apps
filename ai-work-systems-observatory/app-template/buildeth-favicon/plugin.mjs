import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const OUT_FILE = "public/favicon.svg";
const SIZE = 32;
const GRADIENT_ANGLE = 141;
const GRADIENT_START_OFFSET = "-1%";
const GRADIENT_END_OFFSET = "85.42%";
const ICON_COLOR = "rgba(0, 0, 0, 0.55)";
const BORDER_COLOR = "rgba(0, 0, 0, 0.08)";
const BACKGROUND_IMAGE_SCALE = 1.44;
const CONFIG_KEYS = ["color1", "color2", "iconName"];
const BACKGROUND_IMAGE =
  "data:image/png;base64," +
  [
    "iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAMAAABgZ9sFAAADAFBMVEX+6XOZ5M/f5pf93X6v5cbl5pz934is4sbZ4pP83IP8",
    "5nCZ5M+i48Sq5sKl5MGm5cT94nz95Gv95Gah5cul5cig5Miz58ee5Maq5r7m6aT96Wyu5sW857ry6FT36Enr8C394HL94W3k",
    "8SXq8Bmb5Mqo5saa4sKy58Gd5MH66mf651v96Evs8EDq7SiP4tKU486Y48bB6MO758DF57zP7a726WX932P96FP360/85U/x",
    "7iD96B3B576z57zG6rjA57iz57jd67W86LPW67LD6bLb67HG7YX84Xf552L951/x7kfq6zfh8R/j8Rr87RiV49Gi5cSu5r+w",
    "57yl47jP67e45rfS67Pj6qv65YzU4Ir933/W4Xf95XLw8mv942Hr8lz36Vb76EH37TOh5c6n5sq76MWh5L646LvK6Lfl7bbI",
    "67Kw5LLF6qzU7anT7p3j55316JzL34/a8IjW73r67V7n6l3861b38VX46DXl8y/v7iz17RSX5bzX6rnA6rjp7bXh7LLT7aTf",
    "5pvY7Zf86Xby73Xf7nH55G3b8Gz36Gvs5WHt6Ffo6k/q70bx8EHv6kH86Dva8yz85yno8SHu7BPe7xLL6L2157y756yp46ja",
    "7aO356Gx5aHR8JTZ5JK76JHd64bR24TT8IH07X/d8Hj95Xj26F/s7zr+5zbn8Srg9CXX9CTl7Qyr5sq258HL6qnD5qTG7p67",
    "6Jz65pTc75LL7o+454bX3oL06Xj56nD07W3t61/94lfs6E776kbX9Dz37jzn8jvx7Djx7jL96TL57Cj07Se7676c4rWp47Gz",
    "56rb7anx66Lo7qDh7pvH55Xn7pLP5o2+6oX85YHm5X/q737b4n3q7Hjw53Lf5Gjq9Wfe8VLs70/z5k/X9Ebf8zrt7Dfe7wrb",
    "67ra656+35ze6ZXM14nv54Hm8nP92XDu6GrS8mjY81zn9Ff1706f5K/u7Kj07KTE3I/X44bU323R5GD77k737YXJ34TL7HLe",
    "82Ph513k6EHR5kDm6xug37ou7saIAAAAC3RSTlPX39/fz8/PUFBQUMoqdOAAAAdzSURBVEjHLNBJbBJRGAfwl5iY6ImZ48Rh",
    "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",
  ].join("");

export const buildethFaviconPlugin = (rawConfig) => {
  let projectRoot;

  return {
    name: "buildeth-phosphor-favicon",
    configResolved(config) {
      projectRoot = config.root;
    },
    async buildStart() {
      if (projectRoot === undefined) {
        throw new Error("Buildeth favicon plugin root was not resolved.");
      }

      const config = await normalizeFaviconConfig(rawConfig);
      const outPath = path.resolve(projectRoot, OUT_FILE);
      const iconPath = resolvePhosphorFillSvgPath(projectRoot, config.iconName);
      const iconSvg = await readFile(iconPath, "utf8");
      const faviconSvg = buildFaviconSvg({
        color1: config.color1,
        color2: config.color2,
        iconSvg,
      });
      const existingFaviconSvg = await readFileIfPresent(outPath);

      if (existingFaviconSvg === faviconSvg) {
        return;
      }

      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, faviconSvg, "utf8");

      this.info(
        `[buildeth-phosphor-favicon] Wrote ${path.relative(projectRoot, outPath)} (icon: ${config.iconName})`,
      );
    },
  };
};

export const buildFaviconSvg = (options) => {
  const clipId = "buildeth-favicon-clip";
  const gradientId = "buildeth-favicon-tint";
  const cornerRadius = Math.round(SIZE * 0.18);
  const parsedIcon = parseIconSvg(options.iconSvg);
  const gradientCoords = getLinearGradientCoords(GRADIENT_ANGLE);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">`,
    "<defs>",
    `<clipPath id="${clipId}">`,
    `<rect width="${SIZE}" height="${SIZE}" rx="${cornerRadius}"/>`,
    "</clipPath>",
    `<linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="${gradientCoords.x1}" y1="${gradientCoords.y1}" x2="${gradientCoords.x2}" y2="${gradientCoords.y2}">`,
    `<stop offset="${GRADIENT_START_OFFSET}" stop-color="${escapeXmlAttribute(options.color1)}"/>`,
    `<stop offset="${GRADIENT_END_OFFSET}" stop-color="${escapeXmlAttribute(options.color2)}"/>`,
    "</linearGradient>",
    "</defs>",
    `<g clip-path="url(#${clipId})">`,
    renderBackgroundImage(),
    `<rect width="${SIZE}" height="${SIZE}" fill="url(#${gradientId})" style="mix-blend-mode:color"/>`,
    renderCenteredIcon(parsedIcon),
    "</g>",
    `<rect x="0.5" y="0.5" width="${SIZE - 1}" height="${SIZE - 1}" rx="${Math.max(cornerRadius - 0.5, 0)}" fill="none" stroke="${BORDER_COLOR}" stroke-width="1"/>`,
    "</svg>\n",
  ].join("");
};

const normalizeFaviconConfig = async (value) => {
  if (value === undefined) {
    throw new Error(
      "Buildeth favicon config is missing. Export one `buildethFavicon` object from buildeth.favicon.mjs with the keys: color1, color2, iconName.",
    );
  }

  if (!isRecord(value)) {
    throw new Error(
      "The `buildethFavicon` export in buildeth.favicon.mjs must be an object with the keys: color1, color2, iconName.",
    );
  }

  const keys = Object.keys(value).sort((left, right) => left.localeCompare(right));
  if (
    keys.length !== CONFIG_KEYS.length ||
    keys.some((key, index) => key !== CONFIG_KEYS[index])
  ) {
    throw new Error(
      `Buildeth favicon config must contain exactly these keys: ${CONFIG_KEYS.join(", ")}.`,
    );
  }

  const { assertPhosphorIconName } = await import("./phosphor-icons.mjs");
  const iconName = assertPhosphorIconName(
    assertNonEmptyString(value.iconName, "buildethFavicon.iconName"),
  );

  return {
    color1: assertNonEmptyString(value.color1, "buildethFavicon.color1"),
    color2: assertNonEmptyString(value.color2, "buildethFavicon.color2"),
    iconName,
  };
};

const resolvePhosphorFillSvgPath = (projectRoot, iconName) => {
  const require = createRequire(path.join(projectRoot, "package.json"));
  return require.resolve(`@phosphor-icons/core/assets/fill/${iconName}-fill.svg`);
};

const parseIconSvg = (iconSvg) => {
  const match = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/i.exec(iconSvg.trim());
  if (!match) {
    throw new Error("Icon SVG must contain a single root <svg> element.");
  }

  const [, rawAttributes, body] = match;
  const rawViewBox = parseSvgAttribute(rawAttributes, "viewBox");
  if (rawViewBox === undefined) {
    throw new Error("Icon SVG must include a viewBox attribute.");
  }

  return {
    paths: parseIconPaths(body),
    viewBox: parseViewBox(rawViewBox),
  };
};

const renderCenteredIcon = (parsedIcon) => {
  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = parsedIcon.viewBox;
  const padding = SIZE * 0.18;
  const innerSize = SIZE - padding * 2;
  const scale = Math.min(innerSize / viewBoxWidth, innerSize / viewBoxHeight);
  const translateX = (SIZE - viewBoxWidth * scale) / 2;
  const translateY = (SIZE - viewBoxHeight * scale) / 2;
  const iconPaths = parsedIcon.paths
    .map((iconPath) => renderIconPath(iconPath))
    .join("");

  return `<g fill="${escapeXmlAttribute(ICON_COLOR)}" style="mix-blend-mode:multiply" transform="translate(${formatNumber(translateX)} ${formatNumber(translateY)}) scale(${formatNumber(scale)}) translate(${formatNumber(-viewBoxX)} ${formatNumber(-viewBoxY)})">${iconPaths}</g>`;
};

const renderBackgroundImage = () => {
  const imageSize = SIZE * BACKGROUND_IMAGE_SCALE;
  const offset = (SIZE - imageSize) / 2;

  return `<image href="${escapeXmlAttribute(BACKGROUND_IMAGE)}" x="${formatNumber(offset)}" y="${formatNumber(offset)}" width="${formatNumber(imageSize)}" height="${formatNumber(imageSize)}" preserveAspectRatio="xMidYMid slice"/>`;
};

const parseIconPaths = (body) => {
  const paths = [];

  for (const match of body.matchAll(/<path\b([^>]*)\/?>/gi)) {
    const rawAttributes = match[1];
    const d = parseSvgAttribute(rawAttributes, "d");
    if (d === undefined || d.trim().length === 0) {
      throw new Error("Icon SVG path must include a non-empty d attribute.");
    }

    paths.push({
      clipRule: parseSvgAttribute(rawAttributes, "clip-rule"),
      d: d.trim(),
      fillRule: parseSvgAttribute(rawAttributes, "fill-rule"),
    });
  }

  if (paths.length === 0) {
    throw new Error("Icon SVG must contain at least one path element.");
  }

  return paths;
};

const renderIconPath = (iconPath) => {
  const attributes = [`d="${escapeXmlAttribute(iconPath.d)}"`];

  if (iconPath.fillRule !== undefined) {
    attributes.push(`fill-rule="${escapeXmlAttribute(iconPath.fillRule)}"`);
  }

  if (iconPath.clipRule !== undefined) {
    attributes.push(`clip-rule="${escapeXmlAttribute(iconPath.clipRule)}"`);
  }

  return `<path ${attributes.join(" ")}/>`;
};

const readFileIfPresent = async (filePath) => {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeErrorWithCode(error, "ENOENT")) {
      return undefined;
    }

    throw error;
  }
};

const isNodeErrorWithCode = (error, code) => {
  return isRecord(error) && error.code === code;
};

const parseViewBox = (rawViewBox) => {
  const parts = rawViewBox.trim().split(/[\s,]+/).map(Number);
  if (
    parts.length !== 4 ||
    parts.some((value) => !Number.isFinite(value)) ||
    parts[2] <= 0 ||
    parts[3] <= 0
  ) {
    throw new Error(`Invalid icon SVG viewBox: ${rawViewBox}`);
  }

  return [parts[0], parts[1], parts[2], parts[3]];
};

const parseSvgAttribute = (rawAttributes, attributeName) => {
  const attributePattern = new RegExp(
    `${escapeRegExp(attributeName)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    "i",
  );
  const match = attributePattern.exec(rawAttributes);

  return match?.[1] ?? match?.[2];
};

const getLinearGradientCoords = (angleDegrees) => {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  const x = Math.cos(radians);
  const y = Math.sin(radians);

  return {
    x1: formatPercent(0.5 - x * 0.5),
    x2: formatPercent(0.5 + x * 0.5),
    y1: formatPercent(0.5 - y * 0.5),
    y2: formatPercent(0.5 + y * 0.5),
  };
};

const formatPercent = (value) => {
  return `${formatNumber(value * 100)}%`;
};

const formatNumber = (value) => {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, "");
};

const escapeXmlAttribute = (value) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const escapeRegExp = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const isRecord = (value) => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const assertNonEmptyString = (value, sourceLabel) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${sourceLabel} must be a non-empty string.`);
  }

  return value.trim();
};
