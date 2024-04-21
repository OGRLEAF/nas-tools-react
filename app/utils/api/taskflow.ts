import { APIArrayResourceBase } from "./api_base";


export interface TaskMeta {
    type: string,
    metadata?: any
}

export interface TaskLog {
    level: string,
    create_time: number,
    msg: string
}

export interface TaskState {
    status: "wait" | "running" | "exited" | "timeout" | "finished",
    logs: TaskLog[]
}

export type Task = {
    draft: TaskMeta,
    instance?: TaskState
}

export interface TaskflowInfo {
    name: string,
    id: string,
    tasks: Task[],
    start_time: number,
    status: "ready" | "running" | "exited" | "finished"
}

export interface TaskflowResource {
    ItemType: TaskflowInfo
}

export class Taskflow extends APIArrayResourceBase<TaskflowResource> {
    async list() {
        const result = await this.API.get<{tasks: TaskflowInfo[]}>(`taskflow/list`, { auth: true })
        return result.tasks
    }

    async listHook(options?: unknown): Promise<TaskflowInfo[]> {
        return this.list()
    }
}