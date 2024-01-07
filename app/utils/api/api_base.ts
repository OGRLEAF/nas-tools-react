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
    useMessage?: boolean
}

export interface APIArrayResourceOption extends APIResourceOption {

}



export class APIArrayResourceBase<T, Options = never> extends APIBase {

    // public abstract list(): Promise<T[]>;

    protected async listHook(options?: Options): Promise<T[]> {
        throw new Error("Not implemented")
    }

    protected async updateHook(value: T) {

    }

    protected async updateManyHook(value: T[]) {

    }


    public useResource(option?: APIArrayResourceOption) {

        const [options, setOptions] = useState<Options>()

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
        return {
            useList: function () {
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
            , setOptions,
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