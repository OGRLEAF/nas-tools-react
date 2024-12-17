import { APIArrayResourceBase, APIBase, ResourceType } from "../api_base"
import { SeriesKeyTuple } from "../media/SeriesKey"

export interface SubsFilter {
    res_type?: string
    resolution?: string
    release_team?: string
    rule_id?: number
    include?: string
    exclude?: string
}

export enum SourceType {
    search = "search",
    rss = "rss"
}

export interface FetchSourceConfig {
    src_id: string
    type: SourceType
}


enum EpisodeConfigFlag {
    disable = 0,
    enable = 1
}

export enum SubsStatus {
    scheduled = "scheduled",
    fetching = "fetching",
    finished = "finished",
    stalled = "stalled",
    disabled = "disabled",
}

interface EpisodeState {
    num: number,
    status: SubsStatus
}

export interface TVSubsConfig {
    filter?: SubsFilter,
    sources?: FetchSourceConfig[],
}


interface TVSubsState {
    episodes: Record<number, EpisodeState>,
    status: SubsStatus
}

export interface TVSubsProfile {
    id: number,
    series_key: SeriesKeyTuple,
    state: TVSubsState,
    config: TVSubsConfig
}


export interface TVSubsResource extends ResourceType {
    ItemType: TVSubsProfile
}

export class TVSubscribe extends APIArrayResourceBase<TVSubsResource> {
    public async list() {
        const subs = await this.API.get<{ list: TVSubsProfile[], total: number }>("subscribe/subs", { auth: true });
        return subs.list
    }

    public async del(id: number) {
        const resp = await this.API.del<{ list: TVSubsProfile[], total: number }>(`subscribe/subs/${id}`, { auth: true });
        return true;
    }

    public async update(value: TVSubsProfile) {
        const resp = await this.API.post(`subscribe/subs/${value.id}`, { auth: true, data: value, json: true });
        return true;
    }

    public async add(value: TVSubsProfile) {
        const resp = await this.API.post(`subscribe/subs`, { auth: true, data: value, json: true });
        return true;
    }

    public async action(action:string, payload: TVSubsProfile) {
        return await this.API.post(`subscribe/subs/${payload.id}/action/${action}`, { auth: true, json: true });
    }

    public async updateHook(value: any, options?: any): Promise<boolean> {
        return this.update(value);
    }

    public async addHook(value: any): Promise<boolean> {
        return this.add(value);
    }

    public async listHook(options?: any): Promise<TVSubsProfile[]> {
        return this.list();
    }

    public async deleteHook(value: TVSubsProfile, options?: any): Promise<boolean> {
        return this.del(value.id)
    }

    public async actionHook(action: string, payload: TVSubsProfile) {
        console.log(action, payload)
        await this.action(action, payload);
    }
}