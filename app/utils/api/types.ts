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

export type MediaWorkTypeType = MediaWorkType.TV | MediaWorkType.MOVIE | MediaWorkType.ANI | MediaWorkType.UNKNOWN;

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
  image?: {
    cover: string,
    background?: string,
  },
  links?: {
    tmdb?: string,
    douban?: string
  }
  date?: {
    release: string
  }
}

export enum SeriesKeyType {
  NULL = -1,
  TYPE = 0,
  TMDBID = 1,
  SEASON = 2,
  EPISODE = 3,
}

export class SeriesKey {
  private typeKey: MediaWorkType = MediaWorkType.UNKNOWN;
  private tmdbIdKey?: MediaWork['key']
  private seasonKey?: MediaWorkSeason['key'];
  private episodeKey?: MediaWorkEpisode['key'];
  private _end: SeriesKeyType = SeriesKeyType.NULL;
  constructor(keys?: SeriesKey) {
    if (keys) {
      this.episodeKey = keys.episodeKey;
      this.seasonKey = keys.seasonKey;
      this.tmdbIdKey = keys.tmdbIdKey;
      this.typeKey = keys.typeKey;
      this._end = keys._end;
    }
  }

  public type(type?: MediaWorkType) {
    if (type != undefined) {
      this.typeKey = type;
      this._end = SeriesKeyType.TYPE;
      if (this.typeKey == MediaWorkType.MOVIE) {
        this.seasonKey = undefined;
        this.episodeKey = undefined;
      }
    }

    return this
  }

  public tmdbId(tmdbId?: MediaWork['key']) {
    if (this.typeKey != MediaWorkType.UNKNOWN && tmdbId != "") {
      this._end = SeriesKeyType.TMDBID;
      this.tmdbIdKey = tmdbId;
    }
    return this
  }

  public season(season?: MediaWorkSeason['key']) {
    if (this.t == MediaWorkType.MOVIE) return this;
    if (this.tmdbIdKey != undefined && season != undefined) {
      this._end = SeriesKeyType.SEASON
      this.seasonKey = season;
    }
    return this
  }


  public episode(episode?: MediaWorkEpisode['key']) {
    if (this.t == MediaWorkType.MOVIE) return this;
    if (this.seasonKey != undefined && episode != undefined) {
      this._end = SeriesKeyType.EPISODE
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

  public compare(s?: SeriesKey): SeriesKey['_end'] {
    if (s == undefined) return SeriesKeyType.NULL
    let final = SeriesKeyType.EPISODE;
    final = (s.e == this.e) ? final : SeriesKeyType.SEASON;
    final = (s.s == this.s) ? final : SeriesKeyType.TMDBID;
    final = (s.i == this.i) ? final : SeriesKeyType.TYPE;
    final = (s.t == this.t) ? final : SeriesKeyType.NULL;
    return final
  }

  public equal(s: SeriesKey) {
    return this.compare(s) == SeriesKeyType.EPISODE
  }

  public merge(s: SeriesKey) {
    return new SeriesKey(this).type(s.t ?? this.t).tmdbId(s.i ?? this.i).season(s.s ?? this.s).episode(s.e ?? this.e)
  }

  public diffs(s: SeriesKey) {

  }

  public get s() {
    if (this.end >= SeriesKeyType.SEASON) return this.seasonKey
  }
  public get e() {
    if (this.end >= SeriesKeyType.EPISODE) return this.episodeKey
  }
  public get i() {
    if (this.end >= SeriesKeyType.TMDBID) return this.tmdbIdKey
  }
  public get t() {
    if (this.end >= SeriesKeyType.TYPE) return this.typeKey
  }

  public get end() {
    return this._end
  }

  public get(key: SeriesKeyType) {
    switch (key) {
      case SeriesKeyType.TYPE: return this.t;
      case SeriesKeyType.TMDBID: return this.i;
      case SeriesKeyType.SEASON: return this.s;
      case SeriesKeyType.EPISODE: return this.e;
    }
  }


  public slice(key: SeriesKeyType) {
    const s = new SeriesKey(this);
    if (s._end > key) {
      s._end = key;
    }

    return s
  }
}

export interface MediaWork {
  series: SeriesKey,
  type: MediaWorkType,
  key: number | string,
  title: string
  metadata?: MediaWorkMetadata,
  children?: MediaWork[]
}

export interface MediaWorkSeason extends MediaWork {
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
  children?: MediaWorkEpisode[]
}

export interface MediaWorkEpisode extends MediaWork {
  type: MediaWorkType.TV | MediaWorkType.ANI,
  key: number,
}

export interface Media {

}

export interface MediaFile {
  key: string,
  path: string,
  metadata: {
    vcodec?: any,
    acodec?: any,
    resolution?: [number, number],
    bitDepth: string,
    releaseGroup?: string,
  }
  rels: MediaExternalFile[]
}

export interface MediaExternalFile extends MediaFile {

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
