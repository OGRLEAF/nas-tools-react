export enum SyncMode {
  COPY = "copy",
  LINK = "link",
  softlink = "softlink",
  move = "move",
  rclone = "rclone",
  rclonecopy = "rclonecopy",
  minio = "minio",
  miniocopy = "miniocopy"
}


export enum MediaWorkType {
  TV = "电视剧",
  MOVIE = "电影",
  ANI = "动漫",
  UNKNOWN = '未知',
}

export interface MediaIdentifyContext {
  tmdbId: string,
  type: MediaWorkType,
  season?: number,
  episode?: number,
  year?: string,
  title: string,
}


type Arrayify<T> = {
  [K in keyof T]: Set<T[K]>;
};

export type MediaIdentifyMerged = Arrayify<MediaIdentifyContext>;


export interface MediaFile {
  path: string,
  type: "Video",

}

export interface MediaWorkMetadata {
  title: string,
  description: string,
  image: {
    cover: string,
    background?: string,
  },
  links: {
    tmdb?: string,
    douban?: string
  }
  date: {
    release: string
  }
}

export class SeriesKey {
  private typeKey: MediaWorkType = MediaWorkType.UNKNOWN;
  private tmdbIdKey?: MediaWork['key']
  private seasonKey?: MediaWorkSeason['key'];
  private episodeKey?: MediaWorkEpisode['key'];
  private _end: "type" | "tmdbId" | "episode" | "season" = "type"
  constructor(keys?: SeriesKey) {
    if (keys) {
      this.episodeKey = keys.episodeKey;
      this.seasonKey = keys.seasonKey;
      this.tmdbIdKey = keys.tmdbIdKey;
      this.typeKey = keys.typeKey;
      this._end = keys._end;
    }
  }

  public type(type: MediaWorkType) {
    this.typeKey = type;
    this._end = "type";
    return this
  }

  public tmdbId(tmdbId?: MediaWork['key']) {
    if (this.typeKey != MediaWorkType.UNKNOWN && tmdbId != "") {
      this._end = "tmdbId";
      this.tmdbIdKey = tmdbId;
    }
    return this
  }

  public season(season?: MediaWorkSeason['key']) {
    if (this.tmdbIdKey != undefined) {
      this._end = "season"
      this.seasonKey = season;
    }
    return this
  }


  public episode(episode?: MediaWorkEpisode['key']) {
    if (this.seasonKey != undefined) {
      this._end = "episode"
      this.episodeKey = episode;
    }
    return this
  }

  public uniqueKey() {
    return `${this.typeKey}-${this.tmdbIdKey}-${this.seasonKey}-${this.episodeKey}`
  }

  public getSeries() {
    return {
      type: this.typeKey,
      tmdbId: this.tmdbIdKey,
      season: this.seasonKey,
      episode: this.episodeKey
    }
  }

  public has(key: "tmdbId" | "episode" | "season") {
    switch (key) {
      case "tmdbId": return this.tmdbIdKey != undefined;
      case "episode": return this.episodeKey != undefined;
      case "season": return this.seasonKey != undefined;
    }
  }

  public get s() {
    return this.seasonKey
  }
  public get e() {
    return this.episodeKey
  }
  public get i() {
    return this.tmdbIdKey
  }
  public get t() {
    return this.typeKey
  }

  public get end() {
    return this._end
  }

  public slice(key: "type" | "tmdbId" | "episode" | "season") {
    const s = new SeriesKey(this);
    switch (key) {
      case "type": s.tmdbIdKey = undefined;
      case "tmdbId": s.seasonKey = undefined;
      case "season": s.episodeKey = undefined;
      case "episode": break;
    }
    return s
  }
}

export interface MediaWork {
  series: SeriesKey,
  type: MediaWorkType, // "season" | "episode" | "series" | "movie"
  key: number | string,
  title: string
  metadata?: MediaWorkMetadata,
  children?: MediaWork[]
}

export interface MediaWorkSeason extends MediaWork {
  // series: [MediaWorkType, MediaWork['key'], MediaWorkSeason['key']?],
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
  children?: MediaWorkEpisode[]
}

export interface MediaWorkEpisode extends MediaWork {
  // series: [MediaWorkType, MediaWork['key'], MediaWorkSeason['key']],
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
}

export interface Media {

}

export function mergeObjects(...objects: any[]): any {
  const result: any = {};
  objects.forEach((obj) => {
    for (const key in obj) {
      if (obj[key] !== undefined) {
        if (!result[key]) {
          result[key] = new Set();
        }
        result[key].add(obj[key]);
      }
    }
  });

  return result;
}
