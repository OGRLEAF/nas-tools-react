"use client"
import { APIArrayResourceBase, AddItemType, ItemType, ListOptionType, ResourceType, UpdateItemType, useAPIContext, useResource } from "@/app/utils/api/api_base";
import React, { useEffect, useState, createContext, useContext, MouseEventHandler, useMemo, CSSProperties, forwardRef, useImperativeHandle, ForwardedRef, useCallback } from "react";
import { Section } from "../Section";
import { Alert, App, Button, ButtonProps, Collapse, CollapseProps, ConfigProvider, Drawer, Modal, Popover, PopoverProps, Space, theme } from "antd";
import { PlusOutlined, CloseOutlined, CheckOutlined, RetweetOutlined, ExclamationOutlined, EditOutlined } from "@ant-design/icons"
import { once } from "lodash";
import { NASTOOL } from "@/app/utils/api/api";

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

const createCardFormContext = once(<T extends ResourceType,>() => createContext({} as CardsFormContextType<T>))

export function useCardsFormContext<Res extends ResourceType>() {
    type ContextType = CardsFormContextType<Res>
    const context = useContext<ContextType>(createCardFormContext<Res>());
    return context
}

export function CardsForm<Res extends ResourceType>(props: CardsFormProps<Res>) {
    const { list, setList, actions } = useResource<Res>(props.resource, { initialOptions: props.initialOptions, useMessage: true })
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
                    actions.add(value).then(() => { setOpenEditing(false); setEditingRecord(undefined) })
                } else {
                    actions.update(value).then(() => { setOpenEditing(false); setEditingRecord(undefined) })
                }

            }} />
            else return undefined
        }
    }, [editingRecord, openEditing, FormComponent, actions.add, actions.update])
    const CardsFormContext = createCardFormContext<Res>()
    return <Section title={props.title}
        onRefresh={() => actions.refresh()}
        extra={
            <Space>{actions.capabilities.canAdd ? <Button icon={<PlusOutlined />}
                onClick={() => { openEditor() }} type="primary">添加</Button> : <></>
            }
                {props.extra?.({ list, actions } as ResourceInstance<Res>)}
            </Space>
        }
    >
        <CardsFormContext.Provider value={{
            resource: {
                list,
                setList,
                actions,
            }, options: props, openEditor
        }
        } >
            {props.children}
            < Drawer title={editorOptions?.title ?? props.title} open={openEditing} size="large"
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
    const val = useMemo(() => props.resource?.actions.val ?? ctx.resource.actions.val, [props.resource, ctx.resource]);

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

    const doClear = useCallback(() => {
        setMsg(undefined);
        setResult(undefined)
    }, [])
    useImperativeHandle(ref, () => {
        return {
            doTest,
            doClear,
        }
    })

    const content = <Alert banner style={{ paddingTop: 4, paddingBottom: 4 }} title={msg} type={result ? "success" : "error"}
        closable={{ onClose: () => { doClear() } }}
        showIcon
    />

    return <Space>
        <Popover {...props.popoverProps}

            color={result ? token.colorSuccessBg : token.colorErrorBg}
            styles={{ container: { padding: 2, } }}
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
})

export function CollapsableList<Res extends ResourceType>(options:
    { panelStyle?: CSSProperties, style?: CSSProperties, bordered?: boolean, contentPadding?: number } &
    { cardProps: (record: ItemType<Res>) => CardProps<Res> }) {
    const { cardProps, } = options;
    const ctx = useCardsFormContext<Res>();
    const { list, actions } = ctx.resource;
    const { modal } = App.useApp();
    const { confirm } = modal;
    const items: CollapseProps['items'] = useMemo(() => list?.map((record: ItemType<Res>, index) => {
        const props = cardProps(record);
        const actionButtons: React.ReactNode[] = []
        if (!props.readonly) {
            actionButtons.push(<Button key="edit_button" size="small" style={{ padding: 0 }} icon={<EditOutlined />}
                onClick={(evt) => {
                    evt.stopPropagation();

                    ctx.openEditor(record)
                }} type="text" />)
            if (actions.capabilities.canDelete) {
                const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
                    evt.stopPropagation();
                    confirm({
                        title: `确认删除${ctx.options.title}?`,
                        content: <>{props.title}</>,
                        onOk: () => { actions.del(record).then(() => { actions.refresh() }) }
                    })
                }
                actionButtons.push(<Button key="delete_button"
                    size="small" style={{ padding: 0 }}
                    danger icon={<CloseOutlined />} onClick={onDelete} type="text"></Button>)
            }
        }

        if (props.extra) {
            actionButtons.push(props.extra(ctx.resource))
        }

        return {
            label: props.title,
            children: props.description,
            key: String(index),
            extra: <Space>{actionButtons}</Space>,
            style: options.panelStyle
        }
    }), [list, cardProps, confirm, ctx, options.panelStyle])

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








