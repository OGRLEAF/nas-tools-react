import { MouseEventHandler, useContext, useState } from "react";
import { CardProps, CardnFormContext, CardnFormContextType, CardnFormProps } from ".";
import { Button, Card, Drawer, Modal, Space } from "antd";
import { CloseOutlined } from "@ant-design/icons"

export function ListItemCard<T>({ record, cardProps}: { record: T, cardProps: (record: T) => CardProps }) {
    const ctx = useContext<CardnFormContextType<T>>(CardnFormContext);
    const [open, setOpen] = useState(false);
    const onClose = () => { setOpen(false) }
    const RecordForm = ctx.options.formRender;
    const props = cardProps(record);
    const coverCard = props.cover != undefined;
    const { confirm } = Modal;
    const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
        evt.stopPropagation();
        ctx.performDelete(record, props);
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
            cover={props.cover}
            onClick={() => setOpen(true)}
            title={coverCard ? undefined : props.title}
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
                title={props.cover ? props.title : undefined}
                description={props.description}
            ></Card.Meta>
        </Card>
        <CardnFormContext.Provider value={{ ...ctx, exit: () => setOpen(false) }}>
            <Drawer open={open} size="large" onClose={onClose} >
                {open ? <RecordForm record={record} /> : <></>}
            </Drawer>
        </CardnFormContext.Provider>
    </>
}

export function ListItemCardList<T>({ cardProps }: { cardProps: (record: T) => CardProps }) {
    const ctx = useContext<CardnFormContextType<T>>(CardnFormContext);
    return <Space>
        {
            Object.entries(ctx.data).map(([key, config]) => <ListItemCard key={key} record={config} cardProps={cardProps} />)
        }
    </Space>
}
