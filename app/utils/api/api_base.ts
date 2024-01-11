"use client"
import { useEffect, useState } from "react";
import { API, NASTOOL } from "./api";
import { useSubmitMessage } from "..";
import { get } from "lodash";

export class APIBase {
    protected API: Promise<NASTOOL>
    constructor() {
        this.API = API.getNastoolInstance();

    }

}

export interface APIResourceOption {
    useMessage?: boolean,
    refreshInterval?: number,
}

export interface APIArrayResourceOption extends APIResourceOption {

}

export interface APIArrayResource<T, Options = never> {
}

export abstract class APIArrayResource<T, Options = never> extends APIBase {
}

export class APIArrayResourceBase<T, Options = never> extends APIArrayResource<T, Options> {

    // public abstract list(): Promise<T[]>;

    protected async listHook(options?: Options): Promise<T[]> {
        throw new Error("Not implemented")
    }

    protected async updateHook(value: T) {

    }

    protected addHook?(value: T): Promise<boolean>;

    protected deleteHook?(value: T): Promise<boolean>;

    protected async updateManyHook(value: T[]) {

    }


    public useResource(option?: APIArrayResourceOption) {

        const message = useSubmitMessage(String(this));
        const useMessage = option?.useMessage ?? false;

        const self = this
        const update = async (value: T) => {
            if (useMessage) message.update.loading()
            try {
                if (value != undefined) await self.updateHook(value)
                if (useMessage) message.update.success()
            } catch (e: any) {
                if (useMessage) message.update.error(e)
            }
        }

        const add = self.addHook == undefined ? undefined : async (value: T) => {
            if (useMessage) message.update.loading()
            try {
                if (value != undefined) await self.addHook?.(value)
                if (useMessage) message.update.success()
            } catch (e: any) {
                if (useMessage) message.update.error(e)
            }
        }

        const del = self.deleteHook == undefined ? undefined : async (value: T) => {
            if (useMessage) message.update.loading()
            try {
                if (value != undefined) await self.deleteHook?.(value)
                if (useMessage) message.update.success()
            } catch (e: any) {
                if (useMessage) message.update.error(e)
            }
        }

        function useList() {
            const [options, setOptions] = useState<Options>()
            const [list, setList] = useState<T[]>()
            const refresh = (async () => {
                if (useMessage) message.fetch.loading()
                try {
                    setList(await self.listHook(options))
                    if (useMessage) message.fetch.success()
                } catch (e: any) {
                    if (useMessage) message.fetch.error(e)
                }
            })
            useEffect(() => {
                refresh();
            }, [options])
            return {
                list, setList, refresh
            }
        }
        let useListCache: ReturnType<typeof useList>;
        return {
            useList: () => {
                useListCache = useListCache ?? useList();
                return useListCache;
            },
            add, del,
            updateMany: this.updateManyHook,
            messageContext: message.contextHolder,
            update: update,

        }
    }

}

export interface APIDataResourceOption extends APIResourceOption {
}
export class APIDataResourceBase<T, Options = never> extends APIBase {

    // public abstract list(): Promise<T[]>;

    protected dataHook(options?: Options): Promise<T> {
        throw new Error("Not implemented")
    };

    protected updateHook(value: T): Promise<boolean> {
        throw new Error("Not implemented")
    }

    public useResource(option?: APIDataResourceOption) {
        const message = useSubmitMessage(String(this));
        const useMessage = option?.useMessage ?? false;
        const [data, setData] = useState<T>()
        const [options, setOptions] = useState<Options>()

        const refresh = (async () => {
            if (useMessage) message.fetch.loading()
            try {
                setData(await this.dataHook(options))
                if (useMessage) message.fetch.success()
            } catch (e: any) {
                if (useMessage) message.fetch.error(e)
            }
        })
        useEffect(() => {
            refresh();
        }, [options])
        const self = this
        const update = async (value?: T) => {
            if (useMessage) message.update.loading()
            try {
                if (value != undefined) await self.updateHook(value)
                else if (data != undefined) await self.updateHook(data)
                if (useMessage) message.update.success()
            } catch (e: any) {
                if (useMessage) message.update.error(e)
            }
        }

        return {
            data, setData, refresh, setOptions,
            messageContext: message.contextHolder,
            update
        }
    }
}

export function useResource<T, OptionType>(cls: APIArrayResourceBase<T, OptionType>,) {
    return cls.useResource()
}