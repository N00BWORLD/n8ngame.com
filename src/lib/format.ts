
const SUFFIXES = [
    '', 'K', 'M', 'B', 'T',
    // Double letters starting from AA
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).flatMap(first =>
        Array.from({ length: 26 }, (_, j) => first + String.fromCharCode(65 + j))
    )
];

// AA to ZZ covers a huge range.
// 1000^1 (K)
// 1000^2 (M)
// 1000^3 (B)
// 1000^4 (T)
// 1000^5 (AA) ... 
// This should be enough.

export function formatShort(n: number | string | undefined): string {
    if (n === undefined || n === null) return '0';

    let value = typeof n === 'string' ? parseFloat(n) : n;

    if (isNaN(value)) return '0';
    if (value < 1000) return value < 1 && value > 0 ? value.toFixed(1) : Math.floor(value).toString();

    let suffixIndex = 0;
    while (value >= 1000 && suffixIndex < SUFFIXES.length - 1) {
        value /= 1000;
        suffixIndex++;
    }

    // If it's still huge (beyond supported suffixes), just show scientific or cap
    if (value >= 1000) return value.toExponential(1);

    // If integer, no decimal. If float, 1 decimal.
    // Actually prompt says: "소수점: 기본 1자리 (정수면 소수점 제거)"
    // e.g. 1.2K, 1.0K -> 1K? 
    // Usually 1.2K is better. 1.0K can be 1K. 

    const str = value.toFixed(1);
    if (str.endsWith('.0')) {
        return str.slice(0, -2) + SUFFIXES[suffixIndex];
    }
    return str + SUFFIXES[suffixIndex];
}
