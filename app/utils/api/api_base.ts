"use client"
import { useCallback, useEffect, useMemo, useState, createContext, useContext } from "react";
import { API, NASTOOL, NastoolConfig } from "./api";
import { useSubmitMessage } from "..";
import { get } from "lodash";
import { Modal } from "antd";

export interface APIContext {
    API: NASTOOL,
    setAPI: (API: NASTOOL) => void
}

const defaultConfig: NastoolConfig = {
    https: false,
    host: "",
    port: 0
}

export const APIContext = createContext<APIContext>({
    API: new NASTOOL(defaultConfig),
    setAPI: () => { }
})

export const useAPIContext = () => useContext<APIContext>(APIContext);

export class APIBase {
    private static GLOBAL_API: NASTOOL;
    public readonly API: NASTOOL
    constructor(API?: NASTOOL) {
        this.API = API ?? APIBase.GLOBAL_API;
        APIBase.GLOBAL_API = this.API;
    }

}

export interface APIResourceOption {
    useMessage?: boolean,
    refreshInterval?: number,
}

export interface APIArrayResourceOption<Options = never> extends APIResourceOption {
    initialOptions?: Options,
}

export interface APIDataResourceOption<Options = never> extends APIResourceOption {
    initialOptions?: Options,
}
export class APIDataResourceBase<T, Options = never> extends APIBase {

    // public abstract list(): Promise<T[]>;

    public dataHook(options?: Options): Promise<T> {
        throw new Error("Not implemented")
    };

    public updateHook(value: T): Promise<boolean> {
        throw new Error("Not implemented")
    }


}

export function useDataResource<T, Options = never>(cls: new (API: NASTOOL) => APIDataResourceBase<T, Options>, option?: APIDataResourceOption<Options>) {
    const { API } = useAPIContext();
    const self = useMemo(() => new cls(API), [API, cls])
    const message = useSubmitMessage(String(self));
    const useMessage = option?.useMessage ?? false

    const [options, setOptions] = useState<Options | undefined>(option?.initialOptions)
    const [data, setData] = useState<T>()
    const useData = () => {
        const refresh = useCallback(async () => {
            if (self.API.loginState == false) return
            if (useMessage) message.fetch.loading()
            try {
                setData(await self.dataHook(options))
                if (useMessage) message.fetch.success()
            } catch (e: any) {
                if (useMessage) message.fetch.error(e)
            }
        }, [])
        useEffect(() => {
            refresh();
        }, [refresh])
        return { data, setData, refresh, setOptions }
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



type NoUndefined<T> = T extends undefined ? never : T;

export interface ResourceType {
    ItemType?: any,
    ListOptionType?: any,
    DeleteOptionType?: any,
    AddItemType?: any, //NoUndefined<this['ItemType']>,
    UpdateItemType?: any, // NoUndefined<this['ItemType']>,
    UpdateOptionType?: any,
    ValidateRetType?: boolean
}

export type ItemType<T extends ResourceType> = T['ItemType'];
export type UpdateItemType<T extends ResourceType> = NoUndefined<T['UpdateItemType']>;
export type AddItemType<T extends ResourceType> = NoUndefined<T['AddItemType']>;
export type ListOptionType<T extends ResourceType> = NoUndefined<T['ListOptionType']>;
export type DeleteOptionType<T extends ResourceType> = NoUndefined<T['DeleteOptionType']>;
export type UpdateOptionType<T extends ResourceType> = NoUndefined<T['UpdateOptionType']>;

export class APIArrayResourceBase<T extends ResourceType> extends APIBase {
    // public abstract list(): Promise<T[]>;
    public async listHook(options?: ListOptionType<T>): Promise<ItemType<T>[]> {
        throw new Error("Not implemented")
    }

    public async totalHook?(): Promise<number>;

    public async updateHook?(value: UpdateItemType<T>, options?: UpdateOptionType<T>): Promise<boolean>;

    public addHook?(value: AddItemType<T>): Promise<boolean>;

    public deleteHook?(value: ItemType<T>, options?: DeleteOptionType<T>): Promise<boolean>;

    public deleteManyHook?(values: ItemType<T>[], options?: DeleteOptionType<T>): Promise<boolean>;

    public async validateHook?(value: ItemType<T>): Promise<[boolean, string]>;

    public async updateManyHook?(value: UpdateItemType<T>[], options?: UpdateOptionType<T>): Promise<void>;
}


export function useResource<Res extends ResourceType>(cls: new (API: NASTOOL) => APIArrayResourceBase<Res>, option?: APIArrayResourceOption<ListOptionType<Res>>) {
    const { API } = useAPIContext();
    const self = useMemo(() => new cls(API), [API, cls])
    type GetRes<T> = T extends APIArrayResourceBase<infer T> ? T : Res;
    type T = GetRes<typeof cls>
    function useList() {
        const [loading, setLoading] = useState<boolean>(false);
        const [options, setOptions] = useState<ListOptionType<T> | undefined>(option?.initialOptions)
        const [list, setList] = useState<ItemType<T>[]>()
        const [total, setTotal] = useState<number>(0);
        const refresh = useCallback(async () => {
            if (self.API.loginState)
                setLoading(true)
            if (useMessage) message.fetch.loading()
            try {
                const list = await self.listHook(options)
                setList(list)
                setTotal((await self.totalHook?.()) ?? list.length)
                if (useMessage) message.fetch.success()
            } catch (e: any) {
                if (useMessage) message.fetch.error(e)
            } finally {
                setLoading(false)
            }
        }, [options])


        useEffect(() => {
            refresh()
        }, [refresh])

        return {
            refresh,
            list, setList,
            options,
            setOptions,
            total,
            loading,
        }
    }

    let useListCache: ReturnType<typeof useList>;

    const message = useSubmitMessage(String(cls));
    const deleteMessage = message.bundle("删除");
    const validateMessage = message.bundle("测试");
    const useMessage = option?.useMessage ?? false;
    const [modal, modalContextHolder] = Modal.useModal();



    const attachMessage = <Action extends (...args: any) => Promise<(any | undefined)>, T, Options = never>(callback: Action,
        messageHandler: ReturnType<typeof message.bundle>, refresh?: boolean) => {
        return async (value: T, options?: Options): Promise<Awaited<ReturnType<Action>>> => {
            if (useMessage) messageHandler.loading()
            return await callback(value, options)
                .then((res) => {
                    if (useMessage) messageHandler.success();
                    if (refresh) useListCache?.refresh?.();
                    return res;
                })
                .catch((e) => {
                    if (useMessage) messageHandler.error(e)
                    throw e
                })
        }
    }

    const update = self.updateHook == undefined ? undefined :
        attachMessage<typeof self.updateHook, UpdateItemType<T>, UpdateOptionType<T>>(
            async (value: UpdateItemType<T>, options) => await self.updateHook?.(value, options) ?? false, message, true);

    const add = self.addHook == undefined ? undefined :
        attachMessage<typeof self.addHook, ItemType<T>>(async (value: AddItemType<T>) => await self.addHook?.(value) ?? false, message, true);

    const del = self.deleteHook == undefined ? undefined :
        attachMessage<typeof self.deleteHook, DeleteOptionType<T>>(async (value: DeleteOptionType<T>) => await self.deleteHook?.(value) ?? false, deleteMessage, true);

    const val = self.validateHook == undefined ? undefined :
        attachMessage<typeof self.validateHook, ItemType<T>>(async (value: ItemType<T>) =>
            await self.validateHook?.(value) ?? [false, "Validation method not implemented"],
            validateMessage);

    const delMany = self.deleteManyHook ?
        attachMessage<typeof self.deleteManyHook, ItemType<T>[], DeleteOptionType<T>>(
            async (value: ItemType<T>[], options) => {
                return await self.deleteManyHook?.(value, options) ?? false
            },
            deleteMessage,
            true
        ) : undefined;

    const updateMany = self.updateManyHook ?
        attachMessage<typeof self.updateManyHook, ItemType<T>[], UpdateOptionType<T>>(
            async (value: ItemType<T>[], options) => {
                return await self.updateManyHook?.(value, options)
            },
            message,
            true
        ) : undefined;




    return {
        useList: () => {
            useListCache = useList();
            return useListCache;
        },
        add, del, val,
        confirm: (action?: (value: T) => any) => {
            if (action)
                return async (value: ItemType<T>, title?: string, content?: string) => {
                    await modal.confirm({
                        content,
                        title,
                    })
                    await action(value)
                }
        },
        delMany,
        updateMany: updateMany,
        messageContext: [message.contextHolder, modalContextHolder],
        message,
        update: update,
        api: self

    }
}
