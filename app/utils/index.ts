import { App, message } from "antd";
import { floor } from "lodash";
import { useMemo, useState } from "react";

export function bytes_to_human(value: number, fixed: number = 2): [number, string] {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"]
    const level = Math.min(Math.floor(Math.log2(value + 1e-6) / 10), 5);
    const finalValue = value / ((2 ** 10) ** (level))
    return [floor(finalValue * 10 ** fixed) / (10 ** fixed), units[level] || units[0]]
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

export function useSubmitMessage(key: string) {
    // const{ mes} = App.useApp();
    const [messageApi, contextHolder] = message.useMessage({});

    const success = (msg?: string) => {
        messageApi.open({
            type: 'success',
            key,
            content: '更新成功 ' + (msg ?? ""),
        });
    }
    const error = (msg?: string) => {
        messageApi.open({
            type: 'error',
            key,
            content: '更新失败 ' + (msg ?? ""),
        });
    }
    const loading = (msg?: string) => {
        messageApi.open({
            type: "loading",
            key,
            content: "提交中 " + (msg ?? "")
        })
    }

    const bundle = (action: string, duration?: number) => ({
        loading: (msg?: string) => {
            messageApi.open({
                duration,
                type: "loading",
                key,
                content: `${action}中 ` + (msg ?? "")
            })
        },
        success: (msg?: string) => {
            messageApi.open({
                type: 'success',
                key,
                content: `${action}成功 ` + (msg ?? ""),
            });
        },
        error: (msg?: string) => {
            messageApi.open({
                type: 'error',
                key,
                content: `${action}失败 ` + (msg ?? ""),
            });
        }
    }
    )
    const update = bundle('更新')
    const fetch = bundle('加载')
    const handle = async (p: Promise<any | void>, name?: string) => {
        loading();
        return p.then((res) => {
            success(name);
            return res;
        })
            .catch((e) => {
                error(`${name}${e}`)
            })
    }

    return {
        contextHolder,
        success,
        error,
        loading,
        handle,
        bundle,
        update,
        fetch
    }
}


export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};