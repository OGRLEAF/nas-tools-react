"use client"
import { useEffect, useState } from "react";
import { API, NASTOOL } from "./api";
import { useSubmitMessage } from "..";

export class APIBase {
    protected API: Promise<NASTOOL>
    constructor() {
        this.API = API.getNastoolInstance();

    }

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

    public useResource() {
        const [list, setList] = useState<T[]>()
        const [options, setOptions] = useState<Options>()

        const refresh = (async () => {
            setList(await this.listHook(options))
        })
        // useEffect(() => {
        //     refresh();
        // }, [])
        useEffect(() => {
            refresh();
        }, [options])
        return {
            list, setList, refresh, setOptions,
            updateMany: this.updateManyHook,
            update: this.updateHook
        }
    }

}

export type APIDataResourceOption = {
    useMessage?: boolean
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
            setData(await this.dataHook(options))
            if (useMessage) message.fetch.success();
        })
        useEffect(() => {
            refresh();
        }, [options])

        const update = async (value?: T) => {
            if (useMessage) message.update.loading()
            if (value != undefined) await this.updateHook(value)
            else if (data != undefined) await this.updateHook(data)
            if (useMessage) message.update.success();
        }
        return {
            data, setData, refresh, setOptions,
            messageContext: message.contextHolder,
            update
        }
    }
}

export function useResource<T, OptionType>(cls: APIArrayResourceBase<T, OptionType> | APIDataResourceBase<T, OptionType>,) {
    return cls.useResource()
}