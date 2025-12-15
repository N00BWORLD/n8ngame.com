
const SUFFIXES = ["", "K", "M", "B", "T"];

export function formatCompact(n: number): string {
    if (n < 0) return "0";
    if (n < 1000) return Math.floor(n).toString();

    // 1000 -> 1K (e=3)
    // log10(1000) = 3
    const e = Math.floor(Math.log10(n));
    const group = Math.floor(e / 3);
    const suffixIndex = group - 1; // 10^3 -> index 0 (K)

    let suffix = "";
    if (suffixIndex < SUFFIXES.length) {
        suffix = SUFFIXES[suffixIndex];
    } else {
        // aa, ab ...
        // index 5 -> aa
        const alphaIndex = suffixIndex - SUFFIXES.length;
        const alphabet = "abcdefghijklmnopqrstuvwxyz";

        const firstIdx = Math.floor(alphaIndex / 26);
        const secondIdx = alphaIndex % 26;

        if (firstIdx < 26) {
            suffix = alphabet[firstIdx] + alphabet[secondIdx];
        } else {
            suffix = "zz+";
        }
    }

    const scale = Math.pow(10, group * 3);
    const val = n / scale;

    // 2 decimal places
    return `${val.toFixed(2)}${suffix}`;
}

export const formatShort = formatCompact;
