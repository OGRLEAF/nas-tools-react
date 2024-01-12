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

    protected validateHook?(value: T): Promise<boolean>;

    protected async updateManyHook(value: T[]) {

    }


    public useResource(option?: APIArrayResourceOption) {
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

        const message = useSubmitMessage(String(this));
        const deleteMessage = message.bundle("删除");
        const validateMessage = message.bundle("测试");
        const useMessage = option?.useMessage ?? false;

        const self = this
        const update = async (value: T) => {
            if (useMessage) message.update.loading()
            try {
                if (value != undefined) await self.updateHook(value)
                if (useMessage) message.update.success()
                useListCache?.refresh?.();

            } catch (e: any) {
                if (useMessage) message.update.error(e)
            }
        }

        const add = self.addHook == undefined ? undefined : async (value: T) => {
            if (useMessage) message.update.loading()
            try {
                if (value != undefined) await self.addHook?.(value)
                if (useMessage) message.update.success()
                useListCache?.refresh?.();
            } catch (e: any) {
                if (useMessage) message.update.error(e)
            }
        }

        const del = self.deleteHook == undefined ? undefined : async (value: T) => {
            if (useMessage) deleteMessage.loading()
            try {
                if (value != undefined) await self.deleteHook?.(value)
                if (useMessage) deleteMessage.success()
                useListCache?.refresh?.();
            } catch (e: any) {
                if (useMessage) deleteMessage.error(e)
            }
        }

        const val = self.validateHook == undefined ? undefined : async (value: T) => {
            let result = undefined;
            if (useMessage) validateMessage.loading()
            try {
                if (value != undefined) {
                    result = await self.validateHook?.(value)
                }
                if (useMessage) validateMessage.success()
            } catch (e: any) {
                if (useMessage) validateMessage.error(e)
            }
            return result;
        }

        return {
            useList: () => {
                useListCache = useListCache ?? useList();
                return useListCache;
            },
            add, del, val,
            updateMany: this.updateManyHook,
            messageContext: message.contextHolder,
            message,
            update: update,
            api: self

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

        const self = this
        
        const [options, setOptions] = useState<Options>()
        const [data, setData] = useState<T>()
        const useData = () => {
            const refresh = (async () => {
                if (useMessage) message.fetch.loading()
                try {
                    setData(await self.dataHook(options))
                    if (useMessage) message.fetch.success()
                } catch (e: any) {
                    if (useMessage) message.fetch.error(e)
                }
            })
            useEffect(() => {
                refresh();
            }, [options])
            return { data, setData, refresh }
        }

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
            useData,
            messageContext: message.contextHolder,
            update
        }
    }
}

export function useResource<T, OptionType>(cls: APIArrayResourceBase<T, OptionType>,) {
    return cls.useResource()
}