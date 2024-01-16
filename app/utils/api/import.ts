import { ImportMode, NastoolMediaType } from "./api";
import { APIArrayResourceBase, APIArrayResourceBaseD, APIBase, ResourceType } from "./api_base";
import { MediaWorkSeason } from "./types";

type optionalEpisode = undefined | number

export class Organize extends APIBase {
    constructor() {
        super();
    }

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

export interface OrganizeRecord {
    ID: number,
    MODE: ImportMode,
    CATEGORY: NastoolMediaType,
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

interface OrgnizeHistoryResource extends ResourceType {
    ItemType: OrganizeRecord,
    ListOptionType: HistoryListOption,
    DeleteOptionType: { key: string }
}

export class OrganizeHistory extends APIArrayResourceBaseD<OrgnizeHistoryResource> {
    private total: Promise<number>;
    private totalResolve?: (value: number | PromiseLike<number>) => void
    constructor() {
        super();
        this.total = new Promise((resolve, reject) => {
            this.totalResolve = resolve;
        })
    }
    public async list({ page, pageSize: length, keyword }: HistoryListOption) {
        this.total = new Promise((resolve, reject) => {
            this.totalResolve = resolve;
        })
        const result = await (await this.API).getOrganizationHistoryList({
            page: page ?? 0,
            length: length ?? 20,
            keyword
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

    protected async deleteManyHook<DeleteOption>(values: OrganizeRecord[], options?: DeleteOption | undefined): Promise<boolean> {
        console.log(values)
        return false
    }

    protected async deleteHook(value: OrganizeRecord, options: { key: string }): Promise<boolean> {
        if (options.key) {
            await this.delete([value.ID], options.key);
        }
        return true;
    }

    protected async listHook(options: HistoryListOption) {
        return this.list(options)
    }

    protected async totalHook() {
        return await this.total;
    }


}