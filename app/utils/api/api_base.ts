"use client"
import { useCallback, useEffect, useMemo, useState, createContext, useContext } from "react";
import { API, NASTOOL, NastoolConfig } from "./api";
import { useSubmitMessage } from "..";
import { get } from "lodash";
import { Modal } from "antd";
import { useServerEvent } from "./message/ServerEvent";

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

    public updateHook(value: any): Promise<boolean> {
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
    function useList(API: NASTOOL) {
        const [loading, setLoading] = useState<boolean>(false);
        const [options, setOptions] = useState<ListOptionType<T> | undefined>(option?.initialOptions)
        const [list, setList] = useState<ItemType<T>[]>([])
        const [total, setTotal] = useState<number>(0);
        const refresh = useCallback(async () => {
            if (self.API.loginState) {
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
            } else {
                console.log("Not login")
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
            api: self,
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
            useListCache = useList(API);
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

export type ResList<Res extends ResourceType> = ReturnType<ReturnType<typeof useResource<Res>>['useList']>;

export function useEventDataPatch<Res extends ResourceType>(resourceList: ResList<Res>, eventName: string) {
    const { setList } = resourceList;
    const [pointer, setPointer] = useState<number>(0);
    const { msgs } = useServerEvent(eventName);
    useEffect(() => {
        setList((list) => {
            let updatedList = list;
            msgs.slice(pointer, -1)
                .forEach((msg) => {
                    updatedList = patchData(msg.keys, updatedList, msg.data);
                    setPointer((p: number) => p + 1)
                })
            return updatedList
        })

    }, [msgs, pointer, setList])
}

function isPatchable(target: any, key: string | number) {
    if (Array.isArray(target)) {
        if (typeof key === 'string') {
            console.warn("Data patch failed: trying to patch a list with string-like key", key);
            return false
        } else if (typeof key === "number") {
            if (key > target.length) {
                console.warn("Data patch failed: trying to patch a list with out of range key", key, target.length);
                return false
            } else {
                return true
            }
        } else {
            console.warn("Data patch failed: trying to patch a list with unsupported key", key);
            return false
        }
    } else if (typeof target === "object" && target != null) {
        if (typeof key == "number") console.warn("Data patch failed: trying to patch a object with number-like key", key);
        if (!(key in target)) {
            console.warn("Key should exist, but not found in target object, its a bug.", key, JSON.stringify(target));
        }
        return true
    } else {
        console.warn("Data patch failed: target is not a list or object", key, JSON.stringify(target))
        return false
    }
}

function patchDataNotSafe(keys: (number | string)[], list: any, final: any) {
    const finalKey = keys.pop();
    if (list) {
        let tempTarget = list;
        for (let key of keys) {
            if (isPatchable(tempTarget, key)) {
                tempTarget = tempTarget[key as any]
                // console.log(key, tempTarget)
            }
        }
        if (tempTarget != undefined) {
            if ((finalKey != undefined) && isPatchable(tempTarget, finalKey)) {
                if (Array.isArray(tempTarget)) {
                    tempTarget
                }
                tempTarget[finalKey as any] = final
            }
        }
    } else {
        if (keys[0] == 0) {
            list = [final]
        }
    }
}

function patchData(keys: (number | string)[], data: any, final: any): any {
    const nextKey = keys.shift();
    if (nextKey == undefined) return final;
    if (isPatchable(data, nextKey)) {
        const nextData = data[nextKey as any]
        if (Array.isArray(data) && (typeof nextKey === "number")) {
            if (nextKey == data.length) {
                if (keys.length > 0) console.warn("Key over sized", keys)
                return [...data, final]
            } else if (nextKey < data.length) {
                data[nextKey] = patchData(keys, nextData, final);
                return [...data]
            }
        } else if (typeof data === "object" && data != null) {
            return {
                ...data,
                [nextKey]: patchData(keys, nextData, final)
            }
        }
    }
    return data;
}