import React, { useContext, useMemo, useState } from 'react'
import { CardProps, CardnFormContext, CardnFormContextType, CardnFormProps } from '.';
import { Tabs, TabsProps } from 'antd';
import _ from 'lodash';


export function TabCards<T>({ 
    tabsProps,
    cardProps, onAddTab }: { tabsProps?: TabsProps,cardProps: (record: T) => CardProps, onAddTab?: (name:string) => T }) {
    const ctx = useContext<CardnFormContextType<T>>(CardnFormContext);
    const [open, setOpen] = useState(false);
    const onClose = () => { setOpen(false) }
    const RecordForm = ctx.options.formRender;

    const items = useMemo(() => ctx.data.map((record: T, index) => {
        const props = cardProps(record);
        return {
            label: <div style={{width: "100%"}}>{props.title}</div>,
            children: props.description,
            key: String(index),
            cardProps: props,
            record
        }
    }), [ctx.data, cardProps])

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
            {...tabsProps}
        ></Tabs>
    </>
}