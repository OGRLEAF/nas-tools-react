"use client"
import React, { useEffect, useState, createContext, ReactNode, useContext, MouseEventHandler } from "react";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons"
import { IconDatabase } from "@/app/components/icons";
import { Section } from "../Section";
import { Button, Card, Col, Drawer, Form, Modal, Row, Space, message } from "antd";
import { useSubmitMessage } from "@/app/utils";

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
    cardsLayout?: "cards" | "list"
}

interface CardnFormContextType<T> {
    success: (msg: string) => void,
    error: (msg: string) => void,
    loading: (msg: string) => void,
    refresh: () => void,
    exit: () => void,
    options: CardnFormProps<T>
}

export const CardnFormContext = createContext<CardnFormContextType<any>>({
    success: (msg: string) => { },
    error: (msg: string) => { },
    loading: (msg: string) => { },
    refresh: () => { },
    exit: () => { },
    options: {} as any,
})

export default function CardnForm<T>(options: CardnFormProps<T>) {
    const [list, setList] = useState<T[]>([])
    const updateList = () => {
        const result = options.onFetch();
        result.then((result) => setList(result));
    }
    useEffect(() => { updateList() }, []);
    const cards = Object.entries(list).map(([key, config]) => <ListItemCard key={key} record={config} cardProps={options.cardProps} formRender={options.formRender} />)

    const [openCreateDrawer, setOpenCreateDrawer] = useState(false)
    const RecordForm = options.formRender;
    const cardsLayout = options.cardsLayout || "cards";
    const wrapCards = cardsLayout == "cards"

    const { contextHolder, success, error, loading } = useSubmitMessage("cardnform");

    const ctx: CardnFormContextType<T> = {
        success,
        error,
        loading,
        refresh: () => updateList(),
        exit: () => setOpenCreateDrawer(false),
        options: options,
    }

    return <Section title={options.title} onRefresh={updateList}
        extra={
            <Space>
                <Button icon={<PlusOutlined />} onClick={() => setOpenCreateDrawer(true)} type="primary">添加订阅</Button>
                <Button icon={<IconDatabase />} >默认设置</Button>
            </Space>
        }
    >
        {contextHolder}
        <CardnFormContext.Provider value={ctx}>
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
        </CardnFormContext.Provider>
    </Section>
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
    }
    const actions = [
        ...(ctx.options.extraActions || []).map((action) => <Button key={action.key}
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
            type="text" />),
        ctx.options.onDelete ? <Button key="delete_button" danger icon={<CloseOutlined />} onClick={onDelete} type="text"></Button> : <></>,
    ]

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