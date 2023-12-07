"use client"
import React, { useEffect, useState, createContext, ReactNode, useContext, MouseEventHandler, useMemo } from "react";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons"
import { IconDatabase } from "@/app/components/icons";
import { Section } from "../Section";
import { Button, Card, Col, Collapse, Drawer, Form, Modal, Row, Space, Tabs, TabsProps, message } from "antd";
import { useSubmitMessage } from "@/app/utils";
import { CollapseProps } from "antd/lib";
import _ from "lodash";

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
    cardProps: (record: T) => CardProps,
    formRender: ({ record }: { record?: T, }) => React.JSX.Element,
    cardsLayout?: "cards" | "list" | "collapse" | "tabs"
}


interface CardnFormContextType<T> {
    success: (msg: string) => void,
    error: (msg: string) => void,
    loading: (msg: string) => void,
    refresh: () => void,
    exit: () => void,
    edit: (record: T,) => void,
    create: () => void,
    performDelete: (record: T, cardProps: CardProps) => Promise<boolean>;
    options: CardnFormProps<T>
}

export const CardnFormContext = createContext<CardnFormContextType<any>>({
    success: (msg: string) => { },
    error: (msg: string) => { },
    loading: (msg: string) => { },
    refresh: () => { },
    exit: () => { },
    edit: () => { },
    create: () => { },
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
    const cardsLayout = options.cardsLayout || "cards";
    const wrapCards = cardsLayout == "cards"

    const cards = cardsLayout == "collapse" ? <CollapsableList records={list} cardProps={options.cardProps} formRender={options.formRender} /> :
        cardsLayout == "tabs" ? <TabCards records={list} cardProps={options.cardProps} formRender={options.formRender} /> :
            Object.entries(list).map(([key, config]) => <ListItemCard key={key} record={config} cardProps={options.cardProps} formRender={options.formRender} />)

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

    return <Section title={options.title
    } onRefresh={updateList}
        extra={
            < Space >
                <Button icon={<PlusOutlined />} onClick={() => setOpenCreateDrawer(true)} type="primary">添加订阅</Button>
                <Button icon={<IconDatabase />} >默认设置</Button>
            </Space >
        }
    >
        {contextHolder}
        < CardnFormContext.Provider value={ctx} >
            <Space
                direction={cardsLayout == "cards" ? "horizontal" : "vertical"}
                style={{ width: "100%" }}
                wrap={wrapCards}
            >
                {cards}
            </Space>
            <Drawer open={openCreateDrawer} size="large" onClose={() => setOpenCreateDrawer(false)}>
                <RecordForm record={options.defaultRecord}></RecordForm>
            </Drawer>
        </CardnFormContext.Provider >
    </Section >
}


function ListItemCard<T>({ record, cardProps: _cardProps, formRender }: { record: T, cardProps: CardnFormProps<T>["cardProps"], formRender: CardnFormProps<T>["formRender"] }) {
    const ctx = useContext<CardnFormContextType<T>>(CardnFormContext);
    const [open, setOpen] = useState(false);
    const onClose = () => { setOpen(false) }
    const RecordForm = formRender;
    const cardProps = _cardProps(record);
    const coverCard = cardProps.cover != undefined;
    const { confirm } = Modal;
    const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
        evt.stopPropagation();
        ctx.performDelete(record, cardProps);
    }
    const actions = ctx.options.extraActions?.map((action) => (
        <Button key={action.key}
            icon={action.icon}
            onClick={evt => {
                ctx.loading(action.key);
                evt.stopPropagation();
                action.onClick(record)
                    .then((res) => {
                        ctx.success(action.key)
                    })
                    .catch((e) => {
                        ctx.error(e);
                    })
            }}
            type="text" />
    )) || [];

    if (ctx.options.onDelete) {
        actions.push(<Button key="delete_button" danger icon={<CloseOutlined />} onClick={onDelete} type="text"></Button>)
    }

    return <>
        <Card
            hoverable
            cover={cardProps.cover}
            onClick={() => setOpen(true)}
            title={coverCard ? undefined : cardProps.title}
            extra={
                coverCard ? undefined : actions
            }
            actions={
                !coverCard ? undefined : actions
            }
            style={{
                width: coverCard ? "320px" : undefined
            }}
        >
            <Card.Meta
                title={cardProps.cover ? cardProps.title : undefined}
                description={cardProps.description}
            ></Card.Meta>
        </Card>
        <CardnFormContext.Provider value={{ ...ctx, exit: () => setOpen(false) }}>
            <Drawer open={open} size="large" onClose={onClose} >
                {open ? <RecordForm record={record} /> : <></>}
            </Drawer>
        </CardnFormContext.Provider>
    </>
}

function CollapsableList<T>({ records, cardProps: _cardProps, formRender }: { records: T[], cardProps: CardnFormProps<T>["cardProps"], formRender: CardnFormProps<T>["formRender"] }) {
    const ctx = useContext<CardnFormContextType<T>>(CardnFormContext);
    const [open, setOpen] = useState(false);
    const onClose = () => { setOpen(false) }
    const RecordForm = formRender;

    const { confirm } = Modal;

    const items: CollapseProps['items'] = records.map((record: T, index) => {
        const cardProps = _cardProps(record);
        const coverCard = cardProps.cover != undefined;
        const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
            evt.stopPropagation();
            ctx.performDelete(record, cardProps)
        }
        const actions = ctx.options.extraActions?.map((action) => (
            <Button key={action.key}
                size="small"
                style={{ padding: 0 }}
                icon={action.icon}
                onClick={evt => {
                    ctx.loading(action.key);
                    evt.stopPropagation();
                    action.onClick(record)
                        .then((res) => {
                            ctx.success(action.key)
                        })
                        .catch((e) => {
                            ctx.error(e);
                        })
                }}
                type="text" />
        )) || [];

        if (ctx.options.onDelete) {
            actions.push(<Button key="delete_button" size="small" style={{ padding: 0 }} danger icon={<CloseOutlined />} onClick={onDelete} type="text"></Button>)
        }


        return {
            label: cardProps.title,
            children: cardProps.description,
            key: String(index),
            extra: actions
        }
    })

    return <>
        <Collapse
            items={items}
        >
        </Collapse>
    </>
}

function TabCards<T>({ records, cardProps: _cardProps, formRender }: { records: T[], cardProps: CardnFormProps<T>["cardProps"], formRender: CardnFormProps<T>["formRender"] }) {
    const ctx = useContext<CardnFormContextType<T>>(CardnFormContext);
    const [open, setOpen] = useState(false);
    const onClose = () => { setOpen(false) }
    const RecordForm = formRender;

    const items = useMemo(() => records.map((record: T, index) => {
        const cardProps = _cardProps(record);
        return {
            label: cardProps.title,
            children: cardProps.description,
            key: String(index),
            cardProps,
            record
        }
    }), [records])

    const onEdit: TabsProps['onEdit'] = (e, action) => {
        const itemKey = Number(e);

        const item = items[itemKey]
        if (action == "add") {
            ctx.create()
        } else if (action == "remove" && !_.isNaN(itemKey)) {
            ctx.performDelete(item.record, item.cardProps)
            console.log(item)
        }

    }

    return <>
        <Tabs
            type="editable-card"
            items={items}
            onEdit={onEdit}
        ></Tabs>
    </>
}
// function RecordForm<T>({ children, onFinish }: { children: React.ReactNode, onFinish: (data: T) => Promise<boolean> }) {
//     const [form] = Form.useForm();
//     const [loading, setLoading] = useState(false);
//     const ctx = useContext(CardnFormContext);

//     const _onFinish = (data: T) => {
//         setLoading(true);
//         onFinish(data)
//             .then(ret => {
//                 if (ret) {
//                     ctx.success(`${ret}`);
//                     ctx.refresh();
//                 } else {
//                     ctx.error(`${ret}`)
//                 }
//             })
//             .catch((e) => {
//                 ctx.error(`${e}`)
//             })
//             .finally(() => {
//                 setLoading(false);
//             })

//     }
//     return <Form form={form} layout="vertical" onFinish={_onFinish}>
//         {children}
//         <Row gutter={16}>
//             <Col span={24}>
//                 <Form.Item style={{ float: "right" }}>
//                     <Button loading={loading} type="primary" htmlType="submit">保存</Button>
//                 </Form.Item>
//             </Col>
//         </Row>
//     </Form>

// }