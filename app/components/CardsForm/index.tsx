"use client"
import { APIArrayResourceBase, useResource } from "@/app/utils/api/api_base";
import React, { useEffect, useState, createContext, useContext, MouseEventHandler, useMemo } from "react";
import { Section } from "../Section";
import { Button, ButtonProps, Card, Collapse, CollapseProps, Drawer, Modal, Space } from "antd";
import { PlusOutlined, CloseOutlined, CheckOutlined, RetweetOutlined, ExclamationOutlined, EditOutlined } from "@ant-design/icons"


export interface CardsFormProps<T, API extends APIArrayResourceBase<T, Options>, Options = {}> {
    resource: new () => API,
    title: React.ReactNode,
    layout?: "vertical" | "horizontal",
    children?: React.ReactNode,
    initialOptions?: Options,
    formComponent?: React.FC<{ record?: T, onChange?: (value: T) => void }>,// () => React.JSX.Element,
    extra?: (resource: ReturnType<API['useResource']>) => React.ReactNode
}

export interface CardProps<T, API extends APIArrayResourceBase<T, Options>, Options = {}> {
    cover?: React.ReactNode,
    title: React.ReactNode,
    description: React.ReactNode,
    readonly?: boolean,
    extra?: (resource: ReturnType<API['useResource']>) => React.ReactNode
}


type APIRecordType<Type> = Type extends APIArrayResourceBase<infer T, infer Option> ? T : never;
type APIOptions<Type> = Type extends APIArrayResourceBase<infer T, infer Option> ? Option : never;

export interface CardsFormContextType<T, API extends APIArrayResourceBase<T, Options>, Options = {}> {
    resource: ReturnType<API['useResource']>,
    options: CardsFormProps<T, API, Options>,
    openEditor: (value: T) => void;
}

type GenernalType = CardsFormContextType<any, APIArrayResourceBase<any, any | undefined | never>, any | undefined | never>
export const CardsFormContext = createContext<GenernalType>({
    resource: {} as any,
    options: {} as any,
    openEditor: () => { }
})

export function useCardsFormContext<T, API extends APIArrayResourceBase<T, Options>, Options = {}>() {
    type ContextType = CardsFormContextType<T, API, Options>
    const context = useContext<ContextType>(CardsFormContext as unknown as React.Context<ContextType>);
    return context
}

export function CardsForm<T, API extends APIArrayResourceBase<T, Options>, Options = {}>(props: CardsFormProps<T, API, Options>) {
    const resource = new props.resource().useResource({ initialOptions: props.initialOptions, useMessage: true });
    const { useList, add, update, messageContext } = resource;
    const { refresh } = useList();
    const FormComponent = props.formComponent;
    const [openEditing, setOpenEditing] = useState(false)
    const [editingRecord, setEditingRecord] = useState<T>();
    const [id, setId] = useState(0);
    const openEditor = (value?: T) => {
        setId(id + 1);
        setEditingRecord(value)
        setOpenEditing(true);
    }

    const form = useMemo(() => {
        if (FormComponent) {
            if (openEditing) return <FormComponent record={editingRecord} onChange={(value) => {
                if (editingRecord == undefined) {
                    add?.(value).then(() => { setOpenEditing(false); setEditingRecord(undefined) })
                } else {
                    update(value).then(() => { setOpenEditing(false); setEditingRecord(undefined) })
                }

            }}></FormComponent >
            else return undefined
        }
    }, [editingRecord, openEditing])
    return <Section title={props.title}
        onRefresh={() => refresh()}
        extra={
            <Space>{add ? <Button icon={<PlusOutlined />}
                onClick={() => { openEditor() }} type="primary">添加</Button> : <></>
            }
                {props.extra?.(resource as :ReturnType<API['useResource']> )}
            </Space>
        }
    >
        {messageContext}
        <CardsFormContext.Provider value={{ resource, options: props, openEditor }}>
            {props.children}
            <Drawer title={props.title} open={openEditing} size="large" onClose={() => { setOpenEditing(false); setEditingRecord(undefined) }}>
                {form}
            </Drawer>
        </CardsFormContext.Provider>
    </Section >
}

export function TestButton<T, API extends APIArrayResourceBase<T>>(props: {
    record: () => T,
    resource?: ReturnType<API['useResource']>,
} & ButtonProps) {

    const ctx = useCardsFormContext<T, API>();
    const val = props.resource?.val ?? ctx.resource.val;
    const [result, setResult] = useState<boolean | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    if (val) {
        return <Button type={props.type} size={props.size} loading={loading}
            icon={result == undefined ? <RetweetOutlined /> :
                result ? <CheckOutlined /> : <ExclamationOutlined />}
            onClick={(evt) => {
                setLoading(true);

                evt.stopPropagation();
                val(props.record()).then(async (value) => {
                    console.log(value)
                    setResult(await value)
                    setLoading(false);
                });
            }} >测试</Button>
    } else {
        return undefined
    }
}

export function Cards<T, API extends APIArrayResourceBase<T>>({ cardProps }: { cardProps: (record: T) => CardProps<T, API> }) {
    const ctx = useCardsFormContext<T, API>();
    const { resource } = ctx;
    const { useList } = resource;
    const { list } = useList();
    return <Space>
        {
            list ? Object.entries(list).map(([key, record]) => <ListItemCard<T, API> key={key} record={record} cardProps={cardProps(record)} />) : <></>
        }
    </Space>
}


function ListItemCard<T, API extends APIArrayResourceBase<T>>({ record, cardProps }: { record: T, cardProps: CardProps<T, API> }) {
    const ctx = useCardsFormContext<T, API>();
    const props = cardProps;
    const coverCard = props.cover != undefined;
    const { confirm } = Modal;
    const actions = []

    if (ctx.resource.del) {
        const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
            evt.stopPropagation();
            confirm({
                title: `确认删除${ctx.options.title}?`,
                content: <>{props.title}</>,
                onOk: () => { ctx.resource.del?.(record) }
            })
        }
        actions.push(<Button key="delete_button" danger icon={<CloseOutlined />} onClick={onDelete} type="text"></Button>)
    }

    if (cardProps.extra) {
        actions.push(cardProps.extra(ctx.resource))
    }
    return <>
        <Card
            hoverable
            cover={props.cover}
            onClick={() => ctx.openEditor(record)}
            title={coverCard ? undefined : props.title}
            extra={coverCard ? undefined : actions}
            actions={!coverCard ? undefined : actions}
            style={{
                width: coverCard ? "320px" : undefined
            }}
        >
            <Card.Meta
                title={props.cover ? props.title : undefined}
                description={props.description}
            ></Card.Meta>
        </Card>
    </>
}

export function CollapsableList<T, API extends APIArrayResourceBase<T>>({ cardProps }: { cardProps: (record: T) => CardProps<T, API> }) {
    const ctx = useCardsFormContext<T, API>();
    const { useList } = ctx.resource;
    const { list } = useList();
    const { confirm } = Modal;
    const items: CollapseProps['items'] = list?.map((record: T, index) => {
        const props = cardProps(record);
        const actions = []
        if (!props.readonly) {
            actions.push(<Button key="edit_button" size="small" style={{ padding: 0 }} icon={<EditOutlined />}
                onClick={(evt) => {
                    evt.stopPropagation();
                    ctx.openEditor(record)
                }} type="text" />)
            if (ctx.resource.del) {
                const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
                    evt.stopPropagation();
                    confirm({
                        title: `确认删除${ctx.options.title}?`,
                        content: <>{props.title}</>,
                        onOk: () => { ctx.resource.del?.(record) }
                    })
                }
                actions.push(<Button key="delete_button"
                    size="small" style={{ padding: 0 }}
                    danger icon={<CloseOutlined />} onClick={onDelete} type="text"></Button>)
            }
        }

        if (props.extra) {
            actions.push(props.extra(ctx.resource))
        }

        return {
            label: props.title,
            children: props.description,
            key: String(index),
            extra: <Space>{actions}</Space>
        }
    })

    return <>
        <Collapse
            style={{ width: "100%" }}
            items={items}
        >
        </Collapse>
    </>

}