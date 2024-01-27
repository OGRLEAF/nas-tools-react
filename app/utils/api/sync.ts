import { APIArrayResourceBase, APIBase, ResourceType } from "./api_base";
import { ImportMode as RmtMode } from "./api"
import { SyncMode } from "./types";


export const syncModeMap: Record<SyncMode, RmtMode> = {
    "copy": RmtMode.COPY,
    "link": RmtMode.LINK,
    "softlink": RmtMode.SOFTLINK,
    "move": RmtMode.MOVE,
    "rclone": RmtMode.RCLONE,
    "rclonecopy": RmtMode.RCLONECOPY,
    "minio": RmtMode.MINIO,
    "miniocopy": RmtMode.MINIOCOPY
}


export interface SyncDirectoryBaseConfig {
    from: string,
    to: string,
    unknown?: string,
    syncmod: SyncMode
    compatibility: boolean,
    rename: boolean,
    enabled: boolean
}
export interface SyncDirectoryConfig extends SyncDirectoryBaseConfig {
    readonly id: number,
    syncmod_name: RmtMode,
}

export interface SyncDirectoryUpdateConfig extends SyncDirectoryBaseConfig {
    id?: number
}


export interface DirectorySynResource extends ResourceType {
    ItemType: SyncDirectoryConfig,
    UpdateItemType: SyncDirectoryUpdateConfig
}


export class DirectorySync extends APIArrayResourceBase<DirectorySynResource> {
    constructor() {
        super();
    }

    public async list() {
        const result = await (await this.API).post<{ result: Record<string, SyncDirectoryConfig> }>("sync/directory/list", { auth: true });
        const dirList = Object.values(result.result).map((conf: any) => {
            if (conf.unknown == "") conf.unknown = undefined;
            return conf;
        })
        return dirList
    }
    public async update(config: SyncDirectoryUpdateConfig) {
        const result = await (await this.API).post<{}>("sync/directory/update", {
            data: {
                sid: config.id,
                ...config,
            },
            auth: true,
            json: true
        })
        console.log(result)
        return result;
    }
    public async delete(sid: number) {
        const result = await (await this.API).post<{}>("sync/directory/delete", {
            data: {
                sid: sid
            },
            auth: true,
        })
        return result;
    }

    public async deleteHook(value: SyncDirectoryConfig, options?: any): Promise<boolean> {
        await this.delete(value.id);
        return true;
    }

    public async updateHook(value: SyncDirectoryConfig): Promise<boolean> {
        await this.update(value)
        return true
    }

    public listHook(options?: any): Promise<SyncDirectoryConfig[]> {
        return this.list()
    }
}