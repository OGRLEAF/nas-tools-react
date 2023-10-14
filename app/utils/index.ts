
export function bytes_to_human(value: number, fixed: number = 2): [number, string] {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"]
    const level = Math.min(Math.floor(Math.log2(value + 1e-6) / 10), 5);
    return [value / ((2 ** 10) ** (level)), units[level] || units[0]]
}

export function number_string_to_list(str: string) {
    const groups = str.split(',');
    const episodes = new Set<number>();
    for (const group of groups) {
        const matched = /^(?<start>\d+)-(?<end>\d+)$/g.exec(group);//value.match(/^(?<start>\d+)-(?<end>\d+)$/g);
        if (matched?.groups) {
            const start = Number(matched?.groups?.start);
            const end = Number(matched?.groups?.end);
            if (start < end) {
                for (const n of Array(end - start + 1).keys()) {
                    episodes.add(n + start)
                }
            }
        } else if (/^\d+$/g.test(group)) {
            const num = Number(group);
            episodes.add(num);
        }
    }
    return Array.from(episodes).sort((a, b) => a - b);
}

export function copy_to_clipboard(text: string) {

    if (!navigator.clipboard) {
        // use old commandExec() way
    } else {
        navigator.clipboard.writeText(text)
    }
}

export function asyncEffect(func: CallableFunction) {
    return () => {
        (async () => {
            await func();
        })()
    }
}

