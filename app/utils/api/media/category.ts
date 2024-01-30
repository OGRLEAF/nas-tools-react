import { APIDataResourceBase } from "../api_base";
import { MediaWorkType } from "../types";


export type MediaWorkCategoryType = string;


export class MediaWorkCategory extends APIDataResourceBase<MediaWorkCategoryType[], { type: MediaWorkType }> {

    public async get(type: MediaWorkType) {
        const { category } = await (await this.API).post<{ category: MediaWorkCategoryType[] }>("media/category/list",
            {
                auth: true,
                data: {
                    type: type
                }
            })
        return category;
    }

    public dataHook(options?: { type: MediaWorkType; } | undefined): Promise<string[]> {
        return this.get(options?.type ?? MediaWorkType.UNKNOWN)
    }
}