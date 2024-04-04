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
    status: string,
    logs: TaskLog[]
}

export type Task = [TaskMeta, TaskState]

export interface TaskflowInfo {
    id: string,
    tasks: Task[],
    start_time: number,
    status: string
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