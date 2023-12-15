"use client"
import React, { useEffect, useState, createContext, useContext, MouseEventHandler, useMemo } from "react";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons"
import { IconDatabase } from "@/app/components/icons";
import { Section } from "../Section";
import { Button, Card, Col, Collapse, Drawer, Form, Modal, Row, Space, Tabs, TabsProps, message } from "antd";
import { useSubmitMessage } from "@/app/utils";
import { CollapseProps } from "antd/lib";
import _ from "lodash";
import { CollapsableList } from "./CollapsableList";
import { ListItemCard, ListItemCardList } from "./ListItemCard";
import { TabCards } from "./TabCards";

export interface CardProps {
    cover?: React.ReactNode,
    title: React.ReactNode,
    description: React.ReactNode,
}

export interface CardnFromCardExtra<T> {
    icon: React.ReactNode,
    key: string,
    onClick: (record: T) => Promise<void>
}

export interface CardnFormProps<T> {
    title: string,
    onFetch: () => Promise<T[]>,
    onDelete?: (record: T) => Promise<boolean>,
    extraActions?: CardnFromCardExtra<T>[],
    // onUpdate: (data: T) => Promise<void>,
    defaultRecord?: T,
    // cardProps: (record: T) => CardProps,
    formRender: ({ record }: { record?: T, }) => React.JSX.Element,
    layout?: "vertical" | "horizontal",
    children?: React.ReactNode
}


export interface CardnFormContextType<T> {
    success: (msg: string) => void,
    error: (msg: string) => void,
    loading: (msg: string) => void,
    refresh: () => void,
    exit: () => void,
    edit: (record: T,) => void,
    create: () => void,
    data: T[],
    performDelete: (record: T, cardProps: CardProps) => Promise<boolean>;
    options: CardnFormProps<T>,
}

export const CardnFormContext = createContext<CardnFormContextType<any>>({
    success: (msg: string) => { },
    error: (msg: string) => { },
    loading: (msg: string) => { },
    refresh: () => { },
    exit: () => { },
    edit: () => { },
    create: () => { },
    data: [],
    performDelete: async (action) => false,
    options: {} as any,
})

export default function CardnForm<T>(options: CardnFormProps<T>) {
    const [list, setList] = useState<T[]>([])
    const updateList = () => {
        const result = options.onFetch();
        result.then((result) => setList(result));
    }
    useEffect(() => { updateList() }, []);

    const [openCreateDrawer, setOpenCreateDrawer] = useState(false)
    const RecordForm = options.formRender;
    const { confirm } = Modal;

    const { contextHolder, success, error, loading } = useSubmitMessage("cardnform");
    const ctx: CardnFormContextType<T> = {
        success,
        error,
        loading,
        refresh: () => updateList(),
        exit: () => setOpenCreateDrawer(false),
        edit: () => { },
        create: () => { setOpenCreateDrawer(true) },
        data: list,
        performDelete: async (record, cardProps) => {
            confirm({
                title: "确认删除?",
                content: <>{cardProps.title}</>,
                onOk: () => {
                    if (ctx.options.onDelete) {
                        ctx.loading("删除");
                        ctx.options.onDelete(record)
                            .then((res) => {
                                if (res) {
                                    ctx.success("删除成功")
                                }
                                ctx.refresh();
                            })
                            .catch((e) => {
                                ctx.error(e);
                            })
                    }
                }

            })
            return false
        },
        options: options,
    }

    return <Section title={options.title} onRefresh={updateList}
        extra={
            < Space >
                <Button icon={<PlusOutlined />} onClick={() => setOpenCreateDrawer(true)} type="primary">添加订阅</Button>
                <Button icon={<IconDatabase />}>默认设置</Button>
            </Space >
        }
    >
        {contextHolder}
        < CardnFormContext.Provider value={ctx} >
            <Space
                direction={options.layout ?? "horizontal"}
                style={{ width: "100%" }}
                wrap={(options.layout ?? "horizontal") == "horizontal"}
            >
                {options.children}
            </Space>
            <Drawer open={openCreateDrawer} size="large" onClose={() => setOpenCreateDrawer(false)}>
                <RecordForm record={options.defaultRecord}></RecordForm>
            </Drawer>
        </CardnFormContext.Provider >
    </Section >
}


