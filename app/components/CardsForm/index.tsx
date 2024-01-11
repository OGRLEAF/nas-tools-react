"use client"
import { APIArrayResourceBase, useResource } from "@/app/utils/api/api_base";
import React, { useEffect, useState, createContext, useContext, MouseEventHandler } from "react";
import { Section } from "../Section";
import { Button, ButtonProps, Card, Drawer, Modal, Space } from "antd";
import { PlusOutlined, CloseOutlined, CheckOutlined, RetweetOutlined, ExclamationOutlined } from "@ant-design/icons"

export interface CardsFormProps<T, API extends APIArrayResourceBase<T>> {
    resource: new () => API,
    title: React.ReactNode,
    layout?: "vertical" | "horizontal",
    children?: React.ReactNode,
    formComponent: React.FC<{ record?: T, onChange?: (value: T) => void }>// () => React.JSX.Element,
}

export interface CardProps<T, API extends APIArrayResourceBase<T>> {
    cover?: React.ReactNode,
    title: React.ReactNode,
    description: React.ReactNode,
    extra?: (resource: ReturnType<API['useResource']>) => React.ReactNode
}

export interface CardsFormContextType<T, API extends APIArrayResourceBase<T>> {
    resource: ReturnType<API['useResource']>,
    options: CardsFormProps<T, API>,
}

type GenernalType = CardsFormContextType<any, APIArrayResourceBase<any>>
export const CardsFormContext = createContext<GenernalType>({
    resource: {} as any,
    options: {} as any
})

export function useCardsFormContext<T, API extends APIArrayResourceBase<T>>() {
    type ContextType = CardsFormContextType<T, API>
    const context = useContext<ContextType>(CardsFormContext as unknown as React.Context<ContextType>);
    return context
}

export function CardsForm<T, API extends APIArrayResourceBase<T>>(options: CardsFormProps<T, API>) {
    const resource = new options.resource().useResource({ useMessage: true });
    const { useList, add, messageContext } = resource;
    const { refresh } = useList();
    const FormComponent = options.formComponent;
    const [openCreateDrawer, setOpenCreateDrawer] = useState(false)
    return <Section title={options.title}
        onRefresh={() => refresh()}
        extra={
            add ? <Button icon={<PlusOutlined />} onClick={() => setOpenCreateDrawer(true)} type="primary">添加</Button> : <></>
        }
    >
        {messageContext}
        <CardsFormContext.Provider value={{ resource, options }}>
            <Space
                direction={options.layout ?? "horizontal"}
                style={{ width: "100%" }}
                wrap={(options.layout ?? "horizontal") == "horizontal"}
            >
                {options.children}
            </Space>
            <Drawer open={openCreateDrawer} size="large" onClose={() => setOpenCreateDrawer(false)}>
                <FormComponent onChange={(value) => {
                    add?.(value)
                        .then(() => {
                            setOpenCreateDrawer(false);
                        })
                }}></FormComponent>
            </Drawer>
        </CardsFormContext.Provider>
    </Section>
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
                val(props.record()).then((value) => {
                    console.log(value)
                    setResult(value)
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
    const FormComponent = ctx.options.formComponent;
    const props = cardProps;
    const coverCard = props.cover != undefined;
    const { confirm } = Modal;
    const [open, setOpen] = useState(false)


    const actions = []

    if (ctx.resource.del) {
        const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
            evt.stopPropagation();
            confirm({
                title: "确认删除?",
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
            onClick={() => setOpen(true)}
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
        <Drawer open={open} size="large" onClose={() => setOpen(false)}>
            <FormComponent onChange={(value) => {
                ctx.resource.update(value).then(() => {
                    setOpen(false);
                })
            }} record={record} />
        </Drawer>
    </>
}