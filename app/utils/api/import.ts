import { ImportMode, NASTOOL, NastoolMediaType, TaskType } from "./api";
import { APIArrayResourceBase, APIBase, ResourceType } from "./api_base";
import { MediaWorkSeason, MediaWorkType, SeriesKey, SyncMode } from "./types";

type optionalEpisode = undefined | number

export class Organize extends APIBase {

    public async importTV({ path, files, importMode, season, episodes, target_path, dryrun = true }:
        { path: string; files: string[]; importMode: ImportMode; season: MediaWorkSeason; episodes?: optionalEpisode[]; target_path?: string; dryrun?: boolean; }): Promise<void> {
        console.log(importMode)
        const request = await (await this.API).mediaFileImport(
            {
                path, files, importMode,
                season: season.key,
                tmdbid: String(season.series.i),
                type: season.type as unknown as NastoolMediaType,
                target_path: target_path,
                episodes: episodes
                //  season.key, season.series[0], NastoolMediaType.TV
            })
        console.log(request)
    }

    public async getLibrariesPath() {
        const config = (await this.API).getServerConfig();
        return (await config).media
    }

    public async getHistory({ page, length, keyword }: { page: number, length: number, keyword?: string }) {
        const result = await (await this.API).getOrganizationHistoryList({ page, length, keyword });
        return result;
    }
}


export interface ImportTaskConfig {
    path: string,
    target_path?: string,
    rmt_mode: ImportMode,
    files: [episode: number, string][],
    season?: number,
    tmdbid: string,
    mediaType: MediaWorkType
}
export class ImportTask extends APIBase {
    public async import(config: ImportTaskConfig) {
        console.log(config)
        const result = await (this.API).launchTaskflow("import_taskflow", config);
        return result;
    }
}

export interface OrganizeRecord {
    ID: number,
    MODE: ImportMode,
    CATEGORY: MediaWorkType,
    TMDBID: number,
    TITLE: string,
    YEAR: string,
    SEASON_EPISODE: string,
    SOURCE: string,
    SOURCE_PATH: string,
    SOURCE_FILENAME: string,
    DEST: string,
    DEST_FILENAME: string,
    DEST_PATH: string,
    DATE: string,
    SYNC_MOD: ImportMode,
    RMT_MOD: string
}

export interface HistoryListOption {
    page?: number,
    pageSize?: number,
    keyword?: string
}

export interface OrgnizeHistoryResource extends ResourceType {
    ItemType: OrganizeRecord,
    ListOptionType: HistoryListOption,
    DeleteOptionType: { key: string }
}

export class OrganizeHistory extends APIArrayResourceBase<OrgnizeHistoryResource> {
    private total: Promise<number>;
    private totalResolve?: (value: number | PromiseLike<number>) => void
    constructor(API:NASTOOL) {
        super(API);
        this.total = new Promise((resolve, reject) => {
            this.totalResolve = resolve;
        })
    }
    public async list({ page, pageSize: length, keyword }: HistoryListOption) {
        this.total = new Promise((resolve, reject) => {
            this.totalResolve = resolve;
        })
        const result = await (await this.API).post<{ result: OrganizeRecord[], total: number }>("organization/history/list", {
            data: {
                page: page,
                pagenum: length,
                keyword: keyword
            },
            auth: true
        });
        this.totalResolve?.(result.total);
        return result.result;
    }

    public async delete(ids: OrganizeRecord['ID'][], flag: string) {
        return await (await this.API).post("organization/history/delete", {
            auth: true,
            json: true,
            data: {
                logids: ids,
                flag
            }
        })
    }

    public async deleteManyHook(records: OrganizeRecord[], options?: { key: string }): Promise<boolean> {
        console.log(records, options)
        if (options?.key) {
            await this.delete(records.map((record) => record.ID), options?.key)
            return true;
        }
        throw new Error("缺少options.key")
    }

    public async deleteHook(value: OrganizeRecord, options: { key: string }): Promise<boolean> {
        if (options.key) {
            await this.delete([value.ID], options.key);
        }
        return true;
    }

    public async listHook(options: HistoryListOption) {
        return this.list(options)
    }

    public async totalHook() {
        return await this.total;
    }


}


export interface UnknownRecord {
    id: number,
    path: string,
    to: string,
    name: string,
    rmt_mode: string,
    sync_mode: ImportMode
}

export interface OrganizeUnkownResouce extends ResourceType {
    ItemType: UnknownRecord
}

export class OrganizeUnknown extends APIArrayResourceBase<OrganizeUnkownResouce> {
    async list() {
        const result = await (await this.API).post<{ items: UnknownRecord[] }>("organization/unknown/list", { auth: true })
        return result.items;
    }
    public async listHook(options?: any): Promise<UnknownRecord[]> {
        return this.list();
    }
}