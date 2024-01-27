import { APIDataResourceBase } from "../api_base";
import { MediaWorkType } from "../types";


export type MediaWorkCategoryType = string;


export class MediaWorkCategory extends APIDataResourceBase<MediaWorkCategoryType[]> {
    private type: MediaWorkType
    constructor(type: MediaWorkType) {
        super();
        this.type = type;
    }
    public async get() {
        const { category } = await (await this.API).post<{ category: MediaWorkCategoryType[] }>("media/category/list",
            {
                auth: true,
                data: {
                    type: this.type
                }
            })
        return category;
    }

    public dataHook(options?: undefined): Promise<MediaWorkCategoryType[]> {
        return this.get();
    }
}