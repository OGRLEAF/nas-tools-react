import { useEffect, useState } from "react";
import { API, NASTOOL } from "./api";

export class APIBase {
    protected API: Promise<NASTOOL>
    constructor() {
        this.API = API.getNastoolInstance();

    }

}

export abstract class APIResourceBase<T, Options = never> extends APIBase {

    // public abstract list(): Promise<T[]>;

    protected async listHook(options?: Options): Promise<T[]> {
        return []
    }

    public useResource() {
        const [list, setList] = useState<T[]>([])
        const [options, setOptions] = useState<Options>()

        const refresh = (async () => {
            setList(await this.listHook(options))
        })
        useEffect(() => {
            refresh();
        }, [])
        useEffect(() => {
            refresh();
        }, [options])
        return { list, setList, refresh, setOptions }
    }


}

export function useResource<T, OptionType>(cls: APIResourceBase<T, OptionType>,) {
    return cls.useResource()
}