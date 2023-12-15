import React, { MouseEventHandler, useContext, useState } from 'react'
import { CardProps, CardnFormContext, CardnFormContextType, CardnFormProps } from ".";
import { Button, Collapse, CollapseProps, Modal, } from 'antd';
import { CloseOutlined } from "@ant-design/icons"
import { IconDelete } from '../icons';


export function CollapsableList<T>({ cardProps }: { cardProps: (record: T) => CardProps }) {
    const ctx = useContext<CardnFormContextType<T>>(CardnFormContext);

    const items: CollapseProps['items'] = ctx.data.map((record: T, index) => {
        const props = cardProps(record);
        const coverCard = props.cover != undefined;
        const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
            evt.stopPropagation();
            ctx.performDelete(record, props)
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
            actions.push(<Button key="delete_button" size="small" style={{ padding: 0 }} danger icon={<IconDelete />} onClick={onDelete} type="text"></Button>)
        }

        return {
            label: props.title,
            children: props.description,
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