import { Divider, Tag } from "antd";
import { TagProps } from "antd/lib";
import React from "react";


export interface StateTag<K extends string | number | symbol> {
    key: K,
    color?: TagProps['color']
    value?: React.ReactNode
}

export type StateMap<K extends string | number | symbol> = Record<K, StateTag<K>>

export function StateTag<K extends string | number | symbol>({ stateMap, value, children }: {
    stateMap: StateMap<K>, value: K,
    children?: React.ReactNode
}) {

    const currentState = stateMap[value];
    if (currentState != undefined)
        return <Tag variant="filled" color={currentState.color}>{currentState.value ?? String(value)}
            {children ? <><Divider orientation="vertical" />{children}</> : <></>}
        </Tag>
    else {
        return undefined
    }
}