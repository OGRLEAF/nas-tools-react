import { NASTOOL, NastoolServerConfig } from "./api";
import { APIArrayResourceBase, ResourceType } from "./api_base";
import { ServerConfig } from "./serverConfig";

export interface JellyfinOptions {
    type: "jellyfin",
    api_key: string,
}

export interface EmbyOptions {
    type: "emby",
    api_key: string,
}

export interface PlexOptions {
    type: "plex",
    servername: string,
    username: string,
    password: string,
    token: string,
}


export interface MediaServerConfig {
    host: string,
    playhost: string,
    pathMap: string[]
    options: JellyfinOptions | EmbyOptions | PlexOptions,
    active: boolean
}

export interface MediaServerResource extends ResourceType {
    ItemType: MediaServerConfig
}

export class MediaServer extends APIArrayResourceBase<MediaServerResource> {
    serverConfig: ServerConfig;
    constructor(API: NASTOOL) {
        super(API);
        this.serverConfig = new ServerConfig(this.API)
    }

    public async list(): Promise<MediaServerConfig[]> {
        const serverConfig = await this.serverConfig.get(true);
        const { jellyfin, plex, emby } = serverConfig;
        const usingType = serverConfig.media.media_server;
        return [{
            host: jellyfin.host,
            playhost: jellyfin.play_host,
            pathMap: jellyfin.path_map,
            options: {
                type: "jellyfin",
                api_key: jellyfin.api_key
            },
            active: usingType == "jellyfin"
        },
        {
            host: emby.host,
            playhost: emby.play_host,
            pathMap: emby.path_map,
            options: {
                type: "emby",
                api_key: emby.api_key
            },
            active: usingType == "emby"
        },
        {
            host: plex.host,
            playhost: plex.play_host,
            pathMap: plex.path_map,
            options: {
                type: "plex",
                token: plex.token,
                username: plex.username,
                password: plex.password,
                servername: plex.servername
            },
            active: usingType == "plex"
        }]
    }
    public listHook(options?: undefined): Promise<MediaServerConfig[]> {
        return this.list();
    }
    public async update(config: MediaServerConfig) {
        if (config.options.type == "jellyfin") {
            await this.serverConfig.update({
                media: {
                    media_server: "jellyfin"
                },
                jellyfin: {
                    host: config.host,
                    api_key: config.options.api_key,
                    path_map: config.pathMap,
                    play_host: config.playhost
                }
            } as NastoolServerConfig)
        }
        else if (config.options.type == "emby") {
            await this.serverConfig.update({
                media: {
                    media_server: "emby"
                },
                emby: {
                    host: config.host,
                    api_key: config.options.api_key,
                    path_map: config.pathMap,
                    play_host: config.playhost
                }
            } as NastoolServerConfig)
        } else if (config.options.type == "plex") {
            const { host, options, pathMap, playhost } = config;
            const { servername, username, password, token } = options;
            await this.serverConfig.update({
                media: {
                    media_server: "plex"
                },
                plex: {
                    host: host,
                    servername: servername,
                    username: username,
                    password: password,
                    token: token,
                    path_map: pathMap,
                    play_host: playhost
                }
            } as NastoolServerConfig)
        }
    }
    public async updateHook(value: MediaServerConfig): Promise<boolean> {
        await this.update(value);
        return true;
    }
}