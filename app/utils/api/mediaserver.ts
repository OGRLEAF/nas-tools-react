import { NastoolServerConfig } from "./api";
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
    options: JellyfinOptions | EmbyOptions | PlexOptions
}

export interface MediaServerResource extends ResourceType {
    ItemType: MediaServerConfig
}

export class MediaServer extends APIArrayResourceBase<MediaServerResource> {
    public async list(): Promise<MediaServerConfig[]> {
        const serverConfig = await new ServerConfig().get();
        const { jellyfin, plex, emby } = serverConfig;
        return [{
            host: jellyfin.host,
            playhost: jellyfin.play_host,
            pathMap: jellyfin.path_map,
            options: {
                type: "jellyfin",
                api_key: jellyfin.api_key
            }
        },
        {
            host: emby.host,
            playhost: emby.play_host,
            pathMap: emby.path_map,
            options: {
                type: "emby",
                api_key: emby.api_key
            }
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
            }
        }]
    }
    protected listHook(options?: undefined): Promise<MediaServerConfig[]> {
        return this.list();
    }
    public async update(config: MediaServerConfig) {
        if (config.options.type == "jellyfin") {
            await new ServerConfig().update({
                jellyfin: {
                    host: config.host,
                    api_key: config.options.api_key,
                    path_map: config.pathMap,
                    play_host: config.playhost
                }
            } as NastoolServerConfig)
        }
        else if (config.options.type == "emby") {
            await new ServerConfig().update({
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
            await new ServerConfig().update({
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
    protected async updateHook(value: MediaServerConfig): Promise<void> {
        await this.update(value);
    }
}