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




export interface ResourceType {
    ItemType?: any,
    ListOptionType?: any,
    DeleteOptionType?: any,
    AddItemType?: ResourceType['ItemType']
}

export type ItemType<T extends ResourceType> = T['ItemType'];
export type AddItemType<T extends ResourceType> = T['AddItemType'];
export type ListOptionType<T extends ResourceType> = T['ListOptionType']
export type DeleteOptionType<T extends ResourceType> = T['DeleteOptionType'];

export class APIArrayResourceBase<T extends ResourceType> extends APIBase {
    // public abstract list(): Promise<T[]>;
    protected async listHook(options?: ListOptionType<T>): Promise<ItemType<T>[]> {
        throw new Error("Not implemented")
    }

    protected async totalHook?(): Promise<number>;

    protected async updateHook(value: ItemType<T>) {

    }

    protected addHook?(value: AddItemType<T>): Promise<boolean>;

    protected deleteHook?(value: ItemType<T>, options?: DeleteOptionType<T>): Promise<boolean>;

    protected deleteManyHook?(values: ItemType<T>[], options?: DeleteOptionType<T>): Promise<boolean>;

    protected validateHook?(value: ItemType<T>): Promise<boolean>;

    protected async updateManyHook(value: ItemType<T>[]) {

    }


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

        const actionFlow = <Action extends (...args: any) => (any | void), T, Options = never>(callback: Action,
            messageHandler: ReturnType<typeof message.bundle>) => {
            return async (value: T, options?: Options) => {
                let result: ReturnType<Action> | undefined = undefined;
                if (useMessage) messageHandler.loading()
                try {
                    result = await callback(value, options);
                    if (useMessage) messageHandler.success()
                    useListCache?.refresh?.();
                } catch (e: any) {
                    if (useMessage) messageHandler.error(e)
                }
                return result;
            }
        }

        const update = actionFlow((value: T) => self.updateHook?.(value), message);

        const add = self.addHook == undefined ? undefined :
            actionFlow((value: AddItemType<T>) => self.addHook?.(value), message);

        const del = self.deleteHook == undefined ? undefined :
            actionFlow<typeof self.deleteHook, DeleteOptionType<T>>(async (value: DeleteOptionType<T>) => self.deleteHook?.(value) ?? false, deleteMessage);

        const val = self.validateHook == undefined ? undefined :
            actionFlow<typeof self.validateHook, ItemType<T>>(async (value: ItemType<T>) => self.validateHook?.(value) ?? false, validateMessage);


        const delMany = this.deleteManyHook ?
            actionFlow<typeof this.deleteManyHook, ItemType<T>[], DeleteOptionType<T>>(
                async (value: ItemType<T>[], options) => {
                    return await self.deleteManyHook?.(value, options) ?? false
                },
                deleteMessage
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
            updateMany: this.updateManyHook,
            messageContext: [message.contextHolder, modalContextHolder],
            message,
            update: update,
            api: self

        }
    }

}
