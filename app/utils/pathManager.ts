import { get } from "http";
import { API, NastoolFileListItem } from "@/app/utils/api/api";

export interface FileListTree extends NastoolFileListItem {
    children: FileListTree
}

export default class PathManager {
    private pathArray: string[] = [];
    private startPath: string;
    private history: PathManager[];
    private currentLevel: number = 0;
    private tree: FileListTree[] = [];
    constructor(startPath = "/", initialPath: PathManager | undefined = undefined, enableTree = false) {
        if (initialPath) {
            this.pathArray = [...initialPath.pathArray];
            this.startPath = initialPath.startPath;
            this.currentLevel = initialPath.currentLevel;
            this.history = [...initialPath.history, initialPath];
        } else {
            this.pathArray = [];
            this.history = [];
            this.startPath = startPath;
            // this.setPath(startPath)
        }

    }

    private updateTree() {
        
    }

    public setPath(pathString: string) {
        const pathArray = pathString.split('/').filter((item) => item.length > 0);
        this.pathArray = pathArray;
    }

    public appendPath(name: string) {
        this.pathArray.push(name);
        return new PathManager(this.startPath, this);
    }

    public hasHistory() {
        return this.history.length > 0
    }
    public forward() {
        return this.history.pop();
    }

    public getPathArray() {
        const loaded: string[] = []
        return [
            {
                full: this.startPath,
                name: this.startPath,
                relative: ""
            },
            ...(this.pathArray
                .map((item) => {
                    loaded.push(item);
                    return {
                        full: `${this.startPath}${loaded.join("/")}`,
                        relative: loaded.join("/"),
                        name: item
                    }
                }))
        ]
    }


    public get deepestPath(): string {
        return this.getPathArray().at(-1)?.full || this.startPath;
    }

    public get getBasePath(): string {
        return this.startPath
    }

    public getDeepestRelativePath(): string {
        return this.getPathArray().at(-1)?.relative || "";
    }
}