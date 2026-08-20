import { icons } from "@phosphor-icons/core";

const phosphorIconNameSet = new Set(icons.map((icon) => icon.name));

export const phosphorIcons = icons;
export const phosphorIconNames = Object.freeze(
  icons
    .map((icon) => icon.name)
    .sort((left, right) => left.localeCompare(right)),
);

export const isPhosphorIconName = (value) => {
  return typeof value === "string" && phosphorIconNameSet.has(value);
};

const toKebabCandidate = (value) => {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
};

const suggestPhosphorIconNames = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  const candidate = toKebabCandidate(value);
  if (phosphorIconNameSet.has(candidate)) {
    return [candidate];
  }

  const tokens = candidate.split("-").filter((token) => token.length > 0);
  return phosphorIconNames
    .filter((name) => tokens.some((token) => name.includes(token)))
    .slice(0, 5);
};

export const assertPhosphorIconName = (value) => {
  if (isPhosphorIconName(value)) {
    return value;
  }

  const suggestions = suggestPhosphorIconNames(value);
  const hint =
    suggestions.length > 0
      ? `Did you mean: ${suggestions.join(", ")}?`
      : "Inspect phosphorIconNames from buildeth-favicon/phosphor-icons.mjs for supported names.";

  throw new Error(
    `Unknown Phosphor icon name: ${String(value)}. Phosphor icon names are kebab-case (for example "app-window", not "AppWindow"). ${hint}`,
  );
};
