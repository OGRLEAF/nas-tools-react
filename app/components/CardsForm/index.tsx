"use client"
import { APIArrayResourceBase, AddItemType, ItemType, ListOptionType, ResourceType, UpdateItemType, useAPIContext, useResource } from "@/app/utils/api/api_base";
import React, { useEffect, useState, createContext, useContext, MouseEventHandler, useMemo, CSSProperties, forwardRef, useImperativeHandle, ForwardedRef } from "react";
import { Section } from "../Section";
import { Alert, Button, ButtonProps, Card, Checkbox, Collapse, CollapseProps, ConfigProvider, Drawer, Modal, Popover, PopoverProps, Space, theme } from "antd";
import { PlusOutlined, CloseOutlined, CheckOutlined, RetweetOutlined, ExclamationOutlined, EditOutlined } from "@ant-design/icons"
import { once } from "lodash";
import { NASTOOL } from "@/app/utils/api/api";
import { useSelectionContext } from "./Cards";

type ResourceInstance<Res extends ResourceType> = ReturnType<typeof useResource<Res>>;

export interface CardsFormProps<Res extends ResourceType> {
    resource: new (API: NASTOOL) => APIArrayResourceBase<Res>,
    title: React.ReactNode,
    layout?: "vertical" | "horizontal",
    children?: React.ReactNode,
    initialOptions?: ListOptionType<Res>,
    formComponent?: React.FC<{ record?: ItemType<Res>, onChange?: (value: UpdateItemType<Res>) => void }>,// () => React.JSX.Element,
    extra?: (resource: ResourceInstance<Res>) => React.ReactNode
}

export interface CardProps<Res extends ResourceType> {
    cover?: React.ReactNode,
    title: React.ReactNode,
    description: React.ReactNode,
    readonly?: boolean,
    extra?: (resource: ResourceInstance<Res>) => React.ReactNode
}


export interface OpenEditorOptions<Res extends ResourceType> {
    title?: React.ReactNode,
    form?: CardsFormProps<Res>['formComponent'],
}

export interface CardsFormContextType<Res extends ResourceType> {
    resource: ResourceInstance<Res>,
    options: CardsFormProps<Res>,
    openEditor: (value: ItemType<Res>, options?: OpenEditorOptions<Res>) => void;
}

type GenernalType = {
    resource: ResourceInstance<ResourceType>,
    options: ResourceType,
    openEditor: ((value: ItemType<ResourceType>) => void);
}
export const CardsFormContext = createContext<GenernalType>({
    resource: {} as any,
    options: {} as any,
    openEditor: () => { }
})

type CardFormContextType<Res extends ResourceType> = {
    resource: ResourceInstance<ResourceType>,
    options: ResourceType,
    openEditor: ((value: ItemType<ResourceType>) => void);
}

const createCardFormContext = once(<T extends ResourceType,>() => createContext({} as CardsFormContextType<T>))

export function useCardsFormContext<Res extends ResourceType>() {
    type ContextType = CardsFormContextType<Res>
    const context = useContext<ContextType>(createCardFormContext<Res>());
    return context
}

export function CardsForm<Res extends ResourceType>(props: CardsFormProps<Res>) {
    const resource = useResource<Res>(props.resource, { initialOptions: props.initialOptions, useMessage: true })
    const { useList, add, update, messageContext } = resource;
    const { refresh } = useList();
    const FormComponent = props.formComponent;
    const [openEditing, setOpenEditing] = useState(false)
    const [editingRecord, setEditingRecord] = useState<ItemType<Res>>();
    const [editorOptions, setEditorOptions] = useState<OpenEditorOptions<Res>>();
    const [id, setId] = useState(0);
    const openEditor = (value?: ItemType<Res>, options?: OpenEditorOptions<Res>) => {
        setId(id + 1);
        setEditingRecord(value)
        setOpenEditing(true);
        setEditorOptions(options)
    }

    const form = useMemo(() => {
        if (FormComponent) {
            if (openEditing) return <FormComponent record={editingRecord} onChange={(value) => {
                if (editingRecord == undefined) {
                    add?.(value).then(() => { setOpenEditing(false); setEditingRecord(undefined) })
                } else {
                    update?.(value).then(() => { setOpenEditing(false); setEditingRecord(undefined) })
                }

            }} />
            else return undefined
        }
    }, [editingRecord, openEditing, FormComponent, add, update])
    const CardsFormContext = createCardFormContext<Res>()
    return <Section title={props.title}
        onRefresh={() => refresh()}
        extra={
            <Space>{add ? <Button icon={<PlusOutlined />}
                onClick={() => { openEditor() }} type="primary">添加</Button> : <></>
            }
                {props.extra?.(resource as ResourceInstance<Res>)}
            </Space>
        }
    >
        {messageContext}
        <CardsFormContext.Provider value={{ resource, options: props, openEditor }}>
            {props.children}
            <Drawer title={editorOptions?.title ?? props.title} open={openEditing} size="large"
                onClose={() => { setOpenEditing(false); setEditingRecord(undefined) }}>
                {form}
            </Drawer>
        </CardsFormContext.Provider>
    </Section >
}


export type TestButtonAction = { doTest: () => void, doClear: () => void };
export const TestButton = forwardRef(function TestButton<Res extends ResourceType>(props: {
    record: () => ItemType<Res>,
    resource?: ResourceInstance<Res>,
    msgType?: "alert" | "popover",
    btnProps?: ButtonProps,
    popoverProps?: PopoverProps,
}, ref: ForwardedRef<TestButtonAction>) {
    const ctx = useCardsFormContext<Res>();
    const val = props.resource?.val ?? ctx.resource.val;
    const [result, setResult] = useState<boolean | undefined>(undefined);
    const [msg, setMsg] = useState<string>();
    const [loading, setLoading] = useState(false);
    const type = props.msgType ?? "alert"
    const { token } = theme.useToken()

    const doTest = async () => {
        if (val) {
            setLoading(true);
            return await val(props.record())
                .then(async ([flag, msg]) => {
                    setResult(flag)
                    setMsg(msg);
                })
                .catch(e => {
                    setResult(false)
                    setMsg(String(e))
                })
                .finally(() => setLoading(false))
        }
    }

    const doClear = () => {
        setMsg(undefined);
        setResult(undefined)
    }
    useImperativeHandle(ref, () => {
        return {
            doTest,
            doClear,
        }
    })

    if (val) {
        const content = <Alert banner style={{ paddingTop: 4, paddingBottom: 4 }} message={msg} type={result ? "success" : "error"} closable
            showIcon
            onClose={() => { doClear() }} />

        return <Space>
            <Popover {...props.popoverProps}

                color={result ? token.colorSuccessBg : token.colorErrorBg}
                overlayInnerStyle={{ padding: 2, }}
                content={content} open={(result != undefined) && props.msgType == "popover"}>
                <Button {...props.btnProps} loading={loading}
                    icon={result == undefined ? <RetweetOutlined /> :
                        result ? <CheckOutlined /> : <ExclamationOutlined />}
                    onClick={(evt) => { evt.stopPropagation(); doTest(); }} >测试</Button>
            </Popover>

            {
                ((result != undefined) && type == "alert") ? content : <></>
            }
        </Space>
    } else {
        return undefined
    }
})

export function ListItemCard<Res extends ResourceType>({ record, cardProps, }: { record: ItemType<Res>, cardProps: CardProps<Res> }) {
    const ctx = useCardsFormContext<Res>();
    const selectContext = useSelectionContext<Res>()
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



    const cardTitle = selectContext ?
        <Checkbox value={record[selectContext.key]} key={record[selectContext.key]}
            onClick={(evt) => { evt.stopPropagation() }}
        >{props.title}</Checkbox>
        : props.title

    if (cardProps.extra) {
        actions.push(cardProps.extra(ctx.resource))
    }
    return <>
        <Card
            hoverable
            cover={props.cover}
            onClick={(evt) => {
                evt.stopPropagation();
                if (ctx.resource.update) {
                    ctx.openEditor(record, { title: <>{ctx.options.title} / {props.title}</> })
                }
            }}

            title={coverCard ? undefined : cardTitle}
            extra={coverCard ? undefined : actions}
            actions={!coverCard ? undefined : actions}
            style={{
                width: coverCard ? "320px" : undefined
            }}
        >
            <Card.Meta
                title={props.cover ? cardTitle : undefined}
                description={props.description}
            ></Card.Meta>
        </Card>
    </>
}

export function CollapsableList<Res extends ResourceType>(options:
    { panelStyle?: CSSProperties, style?: CSSProperties, bordered?: boolean, contentPadding?: number } &
    { cardProps: (record: ItemType<Res>) => CardProps<Res> }) {
    const { cardProps, } = options;
    const ctx = useCardsFormContext<Res>();
    const { useList } = ctx.resource;
    const { list } = useList();
    const { confirm } = Modal;
    const items: CollapseProps['items'] = useMemo(() => list?.map((record: ItemType<Res>, index) => {
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
            extra: <Space>{actions}</Space>,
            style: options.panelStyle
        }
    }), [list])

    return <ConfigProvider theme={{
        components: {
            Collapse: {
                contentPadding: options.contentPadding ?? 16
            }
        }
    }} >
        <Collapse
            style={{ width: "100%", ...options.style }}
            items={items}
            {...options}
        >
        </Collapse>
    </ ConfigProvider >

}