export const formatPercentPoints = (
	value: number,
	maximumFractionDigits: number,
): string =>
	new Intl.NumberFormat(undefined, {
		style: 'percent',
		maximumFractionDigits,
	}).format(value / 100);
