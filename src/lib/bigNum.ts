export interface BigNum {
    m: number; // mantissa, 1 <= m < 10
    e: number; // exponent, integer
}

// Construction
export function fromNumber(n: number): BigNum {
    if (n === 0) return { m: 0, e: 0 };
    if (n < 0) return { m: 0, e: 0 }; // Clamp negative for this game context

    let e = Math.floor(Math.log10(n));
    let m = n / Math.pow(10, e);

    // Normalize logic (sometimes floating point math leaves 9.9999...)
    return normalize({ m, e });
}

export function normalize(b: BigNum): BigNum {
    if (b.m === 0) return { m: 0, e: 0 };

    while (b.m >= 10) {
        b.m /= 10;
        b.e++;
    }
    while (b.m < 1 && b.m > 0) {
        b.m *= 10;
        b.e--;
    }

    if (b.m <= 0) return { m: 0, e: 0 }; // Safety

    return b;
}

// Operations
export function add(a: BigNum, b: BigNum): BigNum {
    // If diff is too large, small number is negligible
    const diff = a.e - b.e;
    if (diff > 15) return a;
    if (diff < -15) return b;

    // Align to larger exponent
    if (a.e >= b.e) {
        const scaledB = b.m * Math.pow(10, b.e - a.e);
        return normalize({ m: a.m + scaledB, e: a.e });
    } else {
        const scaledA = a.m * Math.pow(10, a.e - b.e);
        return normalize({ m: scaledA + b.m, e: b.e });
    }
}

export function sub(a: BigNum, b: BigNum): BigNum {
    // a - b
    const diff = a.e - b.e;

    if (diff > 15) return a; // b is negligible
    if (diff < -15) return { m: 0, e: 0 }; // a is negligible, clamp to 0 (no negatives)

    // Align exponents
    if (a.e >= b.e) {
        let scaledB = b.m * Math.pow(10, b.e - a.e);
        let val = a.m - scaledB;
        if (val < 0) return { m: 0, e: 0 };
        return normalize({ m: val, e: a.e });
    } else {
        return { m: 0, e: 0 }; // b > a, clamped
    }
}

export function mul(a: BigNum, b: BigNum): BigNum {
    return normalize({ m: a.m * b.m, e: a.e + b.e });
}

export function cmp(a: BigNum, b: BigNum): number {
    // 1 if a > b, -1 if a < b, 0 if equal
    if (a.e > b.e) return 1;
    if (a.e < b.e) return -1;
    if (a.m > b.m) return 1;
    if (a.m < b.m) return -1;
    return 0;
}

export function toNumber(val: BigNum | number): number {
    if (typeof val === 'number') return val;
    return val.m * Math.pow(10, val.e);
}

// 0-11: fixed suffixes
const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];

export function formatBigNum(b: BigNum): string {
    if (b.m === 0) return "0";
    if (b.e < 3) return Math.floor(b.m * Math.pow(10, b.e)).toString(); // 0-999

    const group = Math.floor(b.e / 3);
    const suffixIndex = group - 1; // 10^3 -> group 1 -> index 0 (K)

    // Remainder handling for mantissa display
    // e = 3 -> group 1 -> m * 10^(3 - 3*1) -> m * 10^0 = m
    // e = 4 -> group 1 -> m * 10^1
    // e = 5 -> group 1 -> m * 10^2
    const scale = Math.pow(10, b.e % 3);
    const val = b.m * scale;

    let suffix = "";
    if (suffixIndex < 0) {
        // Should catch e < 3 above, but safety
        return Math.floor(val).toString();
    } else if (suffixIndex < SUFFIXES.length) {
        suffix = SUFFIXES[suffixIndex];
    } else {
        // Generate AA..ZZ
        // index 12 -> AA
        // 0 -> A, 25 -> Z
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const alphaIndex = suffixIndex - SUFFIXES.length; // 0 based for AA

        // 2 chars (AA..ZZ) = 26 * 26 = 676 combinations
        // First char
        const firstIdx = Math.floor(alphaIndex / 26);
        const secondIdx = alphaIndex % 26;

        if (firstIdx < 26) {
            suffix = alphabet[firstIdx] + alphabet[secondIdx];
        } else {
            // Fallback or extend to 3 chars? Spec says "2글자 알파벳".
            // Ensure we don't crash if it goes beyond ZZ (10^2000+)
            suffix = "ZZ+";
        }
    }

    // Value Formatting (2 decimal places usually)
    // Spec: "소수 2자리 고정"
    // However, if < 1000, we handled raw.
    // For formatted: 1.23K, 10.50M, 500.00B
    // val is between 1 and 999.
    return `${val.toFixed(2)}${suffix}`;
}
