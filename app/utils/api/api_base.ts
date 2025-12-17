"use client"
import { useCallback, useEffect, useMemo, useState, createContext, useContext, use } from "react";
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

export function useAPIContext() {
    return useContext<APIContext>(APIContext)
}

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

    public async actionHook?(action: string, paylaod: ItemType<T>): Promise<void>;
}

type ResourceClass<T extends ResourceType> = new (API: NASTOOL) => APIArrayResourceBase<T>;
type InferResourceType<T> = T extends APIArrayResourceBase<infer T> ? T : never;

function useListActions<Res extends ResourceType>(resource: APIArrayResourceBase<Res>, option?: APIArrayResourceOption<ListOptionType<Res>>) {
    const { API } = useAPIContext();
    const [options, setOptions] = useState<ListOptionType<Res> | undefined>(option?.initialOptions)
    const fetch = useCallback(async () => {
        if (API.loginState) {
            try {
                const list = await resource.listHook(options)
                return list
            } catch (e: any) {
                throw e;
            }
        } else {
            console.log("Not login")
            throw new Error("Not login yet")
        }

    }, [options])

    const update = useCallback(async (value: UpdateItemType<Res>, options?: UpdateOptionType<Res>) => {
        if(resource.updateHook) {
            return await resource.updateHook(value, options);
        } 
    }  , [resource])

    const add = useCallback(async (value: AddItemType<Res>) => {
        if(resource.addHook) {
            return await resource.addHook(value);
        } 
    } , [resource])
    
    const del = useCallback(async (value: ItemType<Res>, options?: DeleteOptionType<Res>) => {
        if(resource.deleteHook) {
            return await resource.deleteHook(value, options);
        } 
    } , [resource])

    const val = useCallback(async (value: ItemType<Res>) => {
        if(resource.validateHook) {
            return await resource.validateHook(value);
        }  else {
            throw new Error("Validate hook not implemented")
        }
    } , [resource])

    const delMany = useCallback(async (values: ItemType<Res>[], options?: DeleteOptionType<Res>) => {
        if(resource.deleteManyHook) {
            return await resource.deleteManyHook(values, options);
        } 
    } , [resource])

    const updateMany = useCallback(async (values: UpdateItemType<Res>[], options?: UpdateOptionType<Res>) => {
        if(resource.updateManyHook) {
            return await resource.updateManyHook(values, options);
        } 
    } , [resource])

    const capabilities = useMemo(() => ({
        canAdd: typeof resource.addHook === "function",
        canDelete: typeof resource.deleteHook === "function",
        canUpdate: typeof resource.updateHook === "function",
        canValidate: typeof resource.validateHook === "function",
        canDeleteMany: typeof resource.deleteManyHook === "function",
        canUpdateMany: typeof resource.updateManyHook === "function",

    }), [resource])
    
    return {
        fetch, setOptions, update, add, del, val, delMany, updateMany, capabilities
    }
}


export function useResource<Res extends ResourceType>(cls: new (API: NASTOOL) => APIArrayResourceBase<Res>, option?: APIArrayResourceOption<ListOptionType<Res>>) {
    const { API } = useAPIContext();
    const self = useMemo(() => new cls(API), [API, cls])

    const actions = useListActions<Res>(self, option);

    const [list, setList] = useState<ItemType<Res>[]>([]);

    const refresh = useCallback(() => {
        actions.fetch().then(newList => {setList(newList)});
    }, [actions.fetch]);

    useEffect(()=>{
        refresh();
    }, [refresh])

    return {
        list,
        setList,
        actions: {
            ...actions,
            refresh
        }

    }
}

export type ResList<Res extends ResourceType> = ReturnType<typeof useResource<Res>>['setList'];

export function useEventDataPatch<Res extends ResourceType>(setList: ResList<Res>, eventName: string) {
    const [pointer, setPointer] = useState<number>(0);
    const { msgs } = useServerEvent(eventName);
    useEffect(() => {
        setList((list) => {
            let updatedList = list;
            msgs.slice(pointer)
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