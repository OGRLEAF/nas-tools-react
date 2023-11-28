import { Tag } from "antd";
import { TagProps } from "antd/lib";
import React from "react";


export interface StateTag<K extends string | number | symbol> {
    key: K,
    color?: TagProps['color']
    value?: React.ReactNode
}

export type StateMap<K extends string | number | symbol> = Record<K, StateTag<K>>

export function StateTag<K extends string | number | symbol>({ stateMap, value }: {
    stateMap: StateMap<K>, value: K,    
}) {

    const currentState = stateMap[value];
    if(currentState.value != undefined)
        return <Tag bordered={false} color={currentState.color}>{currentState.value}</Tag>
    else {
        return undefined
    }
}