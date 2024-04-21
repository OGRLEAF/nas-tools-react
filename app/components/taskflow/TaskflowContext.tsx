import { ResList, useEventDataPatch, useResource } from "@/app/utils/api/api_base";
import { Taskflow, TaskflowInfo, TaskflowResource } from "@/app/utils/api/taskflow";
import { SetStateAction, createContext, useContext, useEffect, useState } from "react";

interface TaskflowContext {
    list: TaskflowInfo[],
    refresh: () => Promise<void>,
    setList: (value: SetStateAction<TaskflowInfo[]>) => void
}

export const TaskflowContext = createContext<TaskflowContext>({
    list: [],
    refresh: async () => { },
    setList: function (value: SetStateAction<TaskflowInfo[]>): void { },
});


export function useTaskflowList() {
    return useContext(TaskflowContext)
}


export function useTaskflow(taskflowId: string) {
    const [taskflow, setTaskflow] = useState<TaskflowInfo | null>(null)
    const { list: taskflows } = useTaskflowList();
    useEffect(() => {
        setTaskflow(taskflows?.find((item) => item.id === taskflowId) ?? null)
    }, [taskflows, taskflowId])
    return [taskflow]
}


export function TaskflowContextProvider({ children }: { children?: React.ReactNode }) {
    const { useList } = useResource<TaskflowResource>(Taskflow);
    const listHook = useList();
    const { list, setList, refresh } = listHook
    useEventDataPatch(listHook, "task_event");
    return <TaskflowContext.Provider value={{
        list,
        setList,
        refresh
    }}>
        {children}
    </TaskflowContext.Provider>
}