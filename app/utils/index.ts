
export function bytes_to_human(value: number): [number, string] {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"]
    const level = Math.min(Math.floor(Math.log2(value + 1e-6) / 10), 5);
    return [value / ((2 ** 10) ** (level)), units[level] || units[0]]
}