/**
 *       {
            "id": 12,
            "replaced": "\\[アニメ BD\\]",
            "replace": "",
            "front": "",
            "back": "",
            "offset": "",
            "type": 1,
            "group_id": -1,
            "season": -2,
            "enabled": 1,
            "regex": 1,
            "help": "干扰项"
          },
 */

import { APIArrayResourceBase, AddItemType, ResourceType } from "./api_base"
import { MediaWorkType, SeriesKey } from "./types";

export interface WordConfig {
    id: number,
    replaced: string,
    replace: string,
    front: string,
    back: string,
    offset: string,
    type: number,
    group_id: number,
    season: number,
    enabled: boolean,
    regex: number,
    help: string
}

export interface WordConfigGroup {
    id: number,
    name: string,
    type: number,
    seasons: number,
    words: WordConfig[]
}

export interface WordsResource extends ResourceType {
    ItemType: WordConfigGroup,
    AddItemType: { seriesKey: SeriesKey }
}

export class Words extends APIArrayResourceBase<WordsResource>{
    public async list() {
        const { result } = await (await this.API).post<{ result: WordConfigGroup[] }>("words/list", { auth: true });
        return result;
    }

    protected listHook(options?: any): Promise<WordConfigGroup[]> {
        return this.list()
    }

    public async updateWord(group: WordConfigGroup, value: WordConfig) {
        const { replace, replaced, front, back, offset, help, type, season, enabled, regex } = value;
        const result = await (await this.API).post<{ result: WordConfigGroup[] }>("words/item/update",
            {
                auth: true,
                data: {
                    gid: group.id,
                    id: value.id,
                    group_type: group.type,
                    new_replaced: replaced,
                    new_replace: replace,
                    new_front: front,
                    new_back: back,
                    new_offset: offset,
                    new_help: help,
                    type: type,
                    season,
                    enabled: Number(enabled),
                    regex: Number(regex)
                }
            });
        return result;
    }

    public async add(tmdb_id: string, tmdb_type: MediaWorkType) {
        const result = await (await this.API).post("words/group/add", {
            auth: true,
            data: {
                tmdb_id,
                tmdb_type: tmdb_type == MediaWorkType.MOVIE ? "movie" : "tv"
            }
        })
    }

    public async del(groupId: WordConfigGroup['id']) {
        const result = await (await this.API).post("words/group/delete", {
            auth: true,
            data: {
                gid: groupId

            }
        })
    }

    protected async deleteHook(value: WordConfigGroup, options?: any): Promise<boolean> {
        await this.del(value.id);
        return true;
    }

    protected async addHook(value: AddItemType<WordsResource>): Promise<boolean> {
        const { seriesKey } = value;
        if (seriesKey.i != undefined && seriesKey.t != undefined) {
            await this.add(String(seriesKey.i), seriesKey.t)
            return true
        }
        return false
    }
}