import { TorrentVagueState } from "../download";
import { ExternalMediaFileProps, MediaCaptionFileProps, MediaFileProps, UnkownMediaFileProps } from "../types";

type FileKind = "audio" | "video" | "caption" | "unkown"

class FileNameCharacteristic {
    fileName: string;
    base: string;
    extension: string;

    constructor(fileName: string) {
        const { name, ext } = FileNameCharacteristic.splitPath(fileName)
        this.fileName = fileName;
        this.base = name;
        this.extension = ext.toLocaleLowerCase();
    }


    public static splitPath(filePath: string) {
        // Extract trailing name component from path
        const base = filePath.split(/[/\\]/).pop() || '';

        // Match filename before the final dot, and the extension after it
        const match = base.match(/(.*)\.([^.]+)$/);

        if (match) {
            return { name: match[1], ext: `.${match[2]}` };
        }

        return { name: base, ext: '' }; // No extension found
    }
}

export class MediaFile {
    public static readonly accpetFileExtension: string[] = [];
    metadata: Record<string, any> = {};
    fileName: FileNameCharacteristic;
    path?: string = undefined;

    fileKind: FileKind = "unkown"
    constructor(name: FileNameCharacteristic) {
        this.fileName = name;
    }

}

export class MediaVideoFile extends MediaFile {
    public static readonly accpetFileExtension = [".mp4", ".mkv"];
    fileType: "video" = "video";
    // language: string;
    // encoding: string;

    constructor(name: FileNameCharacteristic) {
        super(name)
        this.fileKind = "video"
    }
}

export class MediaCaptionFile extends MediaFile {
    public static readonly accpetFileExtension = [".ass", ".srt"];
    fileType: "caption" = "caption";
    captionType: "ass" | "opg" | "srt";
    // language: string;
    // encoding: string;

    constructor(name: FileNameCharacteristic) {
        super(name)

        if (name.extension == "ass") {
            this.captionType = "ass"
        }
        else {
            this.captionType = "srt"
        }
        this.fileKind = "caption"
    }
}

export class UnkownMediaFile extends MediaFile {

}

export class MediaFileClassifier {

    avaliableFileClass: typeof MediaFile[] = [MediaVideoFile, MediaCaptionFile, MediaFile];
    map: Map<string, typeof MediaFile> = new Map;
    constructor() {
        for (let FileClass of this.avaliableFileClass) {
            FileClass.accpetFileExtension.forEach((extenstion) => {
                this.map.set(extenstion, FileClass);
            })

        }
    }


}


export class LocalMediaFileClassifier extends MediaFileClassifier {

    public byExtension(mediaFile: MediaFile): MediaFile {
        const FileClass = this.map.get(mediaFile.fileName.extension);

        if (FileClass)
            return new FileClass(mediaFile.fileName)

        return new UnkownMediaFile(mediaFile.fileName)
    }

}