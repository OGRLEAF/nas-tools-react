import { APIArrayResourceBase, APIBase, ResourceType } from "../api_base"
import { SeriesKeyTuple } from "../media/SeriesKey"

interface SubsFilter {
    res_type?: string
    resolution?: string
    release_team?: string
    rule?: string
    include?: string
    exclude?: string
}

enum SourceType {
    search = "search",
    rss = "rss"
}

interface FetchSourceConfig {
    src_id: string
    type: SourceType
}


enum EpisodeConfigFlag {
    disable = 0,
    enable = 1
}

enum SubsStatus {
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

interface TVSubsConfig {
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

    public async listHook(options?: any): Promise<TVSubsProfile[]> {
        return this.list();
    }
}