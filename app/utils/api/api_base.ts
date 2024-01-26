"use client"
import { useEffect, useState } from "react";
import { API, NASTOOL } from "./api";
import { useSubmitMessage } from "..";
import { get } from "lodash";
import { Modal } from "antd";

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

export interface APIArrayResourceOption<Options = never> extends APIResourceOption {
    initialOptions?: Options,
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

export function useResource<T, OptionType>(cls: APIArrayResourceBase<{ ItemType: T, ListOptionType: OptionType }>,) {
    return cls.useResource()
}


type NoUndefined<T> = T extends undefined ? never : T;

export interface ResourceType {
    ItemType?: any,
    ListOptionType?: any,
    DeleteOptionType?: any,
    AddItemType?: any, //NoUndefined<this['ItemType']>,
    UpdateItemType?: any, // NoUndefined<this['ItemType']>,
    ValidateRetType?: boolean
}

export type ItemType<T extends ResourceType> = T['ItemType'];
export type UpdateItemType<T extends ResourceType> = NoUndefined<T['UpdateItemType']>;
export type AddItemType<T extends ResourceType> = NoUndefined<T['AddItemType']>;
export type ListOptionType<T extends ResourceType> = NoUndefined<T['ListOptionType']>;
export type DeleteOptionType<T extends ResourceType> = NoUndefined<T['DeleteOptionType']>;

export class APIArrayResourceBase<T extends ResourceType> extends APIBase {
    // public abstract list(): Promise<T[]>;
    protected async listHook(options?: ListOptionType<T>): Promise<ItemType<T>[]> {
        throw new Error("Not implemented")
    }

    protected async totalHook?(): Promise<number>;

    protected async updateHook?(value: UpdateItemType<T>): Promise<boolean>;

    protected addHook?(value: AddItemType<T>): Promise<boolean>;

    protected deleteHook?(value: ItemType<T>, options?: DeleteOptionType<T>): Promise<boolean>;

    protected deleteManyHook?(values: ItemType<T>[], options?: DeleteOptionType<T>): Promise<boolean>;

    protected async validateHook?(value: ItemType<T>): Promise<[boolean, string]>;

    protected async updateManyHook?(value: UpdateItemType<T>[]): Promise<void>;


    public useResource(option?: APIArrayResourceOption<ListOptionType<T>>) {
        function useList() {
            const [loading, setLoading] = useState<boolean>(false);
            const [options, setOptions] = useState<ListOptionType<T> | undefined>(option?.initialOptions)
            const [list, setList] = useState<ItemType<T>[]>()
            const [total, setTotal] = useState<number>(0);
            const refresh = (async () => {
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
            })
            useEffect(() => {
                refresh();
            }, [options])
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

        const message = useSubmitMessage(String(this));
        const deleteMessage = message.bundle("删除");
        const validateMessage = message.bundle("测试");
        const useMessage = option?.useMessage ?? false;
        const [modal, modalContextHolder] = Modal.useModal();

        const self = this

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
            attachMessage<typeof self.updateHook, UpdateItemType<T>>(async (value: UpdateItemType<T>) => await self.updateHook?.(value) ?? false, message, true);

        const add = self.addHook == undefined ? undefined :
            attachMessage<typeof self.addHook, ItemType<T>>(async (value: AddItemType<T>) => await self.addHook?.(value) ?? false, message, true);

        const del = self.deleteHook == undefined ? undefined :
            attachMessage<typeof self.deleteHook, DeleteOptionType<T>>(async (value: DeleteOptionType<T>) => await self.deleteHook?.(value) ?? false, deleteMessage, true);

        const val = self.validateHook == undefined ? undefined :
            attachMessage<typeof self.validateHook, ItemType<T>>(async (value: ItemType<T>) =>
                await self.validateHook?.(value) ?? [false, "Validation method not implemented"],
                validateMessage);

        const delMany = this.deleteManyHook ?
            attachMessage<typeof this.deleteManyHook, ItemType<T>[], DeleteOptionType<T>>(
                async (value: ItemType<T>[], options) => {
                    return await self.deleteManyHook?.(value, options) ?? false
                },
                deleteMessage,
                true
            ) : undefined;

        const updateMany = this.updateManyHook ?
            attachMessage<typeof this.updateManyHook, ItemType<T>[]>(
                async (value: ItemType<T>[]) => {
                    return await self.updateManyHook?.(value)
                },
                message,
                true
            ) : undefined;




        return {
            useList: () => {
                useListCache = useListCache ?? useList();
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

}
