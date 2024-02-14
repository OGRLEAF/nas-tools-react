import { ItemType, ResourceType } from "@/app/utils/api/api_base";
import { Button, Checkbox, Space, SpaceProps } from "antd";
import React, { MouseEventHandler, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CardProps, useCardsFormContext } from ".";
import { CloseOutlined } from "@ant-design/icons";
import { Card, Modal } from "antd";


interface CardsSelectionPropsObject<Res extends ResourceType> {
    key: keyof ItemType<Res>;
    onChange?: (selectedKeys: ItemType<Res>[this['key']][], selected: ItemType<Res>[]) => void;
}

interface CardsSelectionContext<Res extends ResourceType> {
    key: keyof ItemType<Res>;
    selectedKeys?: ItemType<Res>[this['key']][];
    selected?: ItemType<Res>[];
    records?: ItemType<Res>[];
    setRecords?: (records: ItemType<Res>[]) => void;
    onChange?: (selected: ItemType<Res>[]) => void;
}

type CardsSelectionProps<Res extends ResourceType> = CardsSelectionPropsObject<Res> | false;

const SelectionContext = createContext<CardsSelectionContext<any>| false>(false);

export const useSelectionContext = <Res extends ResourceType>() => useContext<CardsSelectionContext<Res> | false>(SelectionContext);

export function useSelection<Res extends ResourceType>(props: CardsSelectionPropsObject<Res>) {
    type KeyType = CardsSelectionPropsObject<Res>['key'];

    const [selected, setSelected] = useState<ItemType<Res>[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<KeyType[]>([]);
    const [records, setRecords] = useState<ItemType<Res>[]>([]);
    const SelectionContext: CardsSelectionContext<Res> = {
        key: props.key,
        selected,
        selectedKeys,
        records,
        setRecords,
        onChange: (selected: ItemType<Res>[]) => {
            const selectedKeys = selected?.map(v => v[props.key]);
            if (props.onChange) {
                props.onChange?.(selectedKeys, selected);
            } else {
                setSelected(selected);
                setSelectedKeys(selectedKeys)
            }
        }
    };
    return SelectionContext
}

export interface CardsProps<Res extends ResourceType> {
    cardProps: (record: ItemType<Res>) => CardProps<Res>;
    spaceProps?: SpaceProps;
    selection?: CardsSelectionContext<Res>;
}

export function Cards<Res extends ResourceType>({ cardProps, spaceProps, selection }: CardsProps<Res>) {
    const ctx = useCardsFormContext<Res>();
    const { resource } = ctx;
    const { useList } = resource;
    const { list } = useList();

    const cards = useMemo(() => <Space {...spaceProps}>
        {
            list && list.map((record, indexAsKey) => <ListItemCard<Res>
                key={selection ? record[selection.key] : indexAsKey}
                record={record}
                cardProps={cardProps(record)} />)
        }
    </Space>, [list, cardProps, selection, spaceProps]);

    useEffect(() => { if (list) selection?.setRecords?.(list) }, [list, selection])

    return selection ? <SelectionContext.Provider value={{ ...selection, records: list }}>
        <Checkbox.Group<ItemType<Res>>
            value={selection ? selection.selectedKeys : undefined}
            onChange={selection ? (values) => {
                const selected = list?.filter((value) => (values.indexOf(value[selection.key]) > -1)) ?? [];
                selection.onChange?.(selected);
            } : undefined}>
            {cards}
        </Checkbox.Group>
    </SelectionContext.Provider> : cards;
}


export function BatchActions<Res extends ResourceType>({ selection }: { selection: CardsSelectionContext<Res> }) {

    const selected = useMemo(() => selection.selected, [selection.selected]);
    const total = useMemo(() => selection.records?.length ?? 0, [selection.records]);
    if (selected) {
        return <Button key="select_all">
            <Checkbox
                indeterminate={selected.length > 0 && (selected.length < (total))}
                checked={selected.length == total}
                onClick={() => {
                    if (selected.length == 0 && selection.records) {
                        selection.onChange?.([...selection.records]);
                    }
                    else {
                        selection.onChange?.([]);
                    }
                }}
            >
                全选 {selected.length}/{total}
            </Checkbox>
        </Button>
    }
}
export function ListItemCard<Res extends ResourceType>({ record, cardProps, }: { record: ItemType<Res>; cardProps: CardProps<Res>; }) {
    const ctx = useCardsFormContext<Res>();
    const selectContext = useSelectionContext<Res>();
    const props = cardProps;
    const coverCard = props.cover != undefined;
    const { confirm } = Modal;
    const actions = [];

    if (ctx.resource.del) {
        const onDelete: MouseEventHandler<HTMLElement> = (evt) => {
            evt.stopPropagation();
            confirm({
                title: `确认删除${ctx.options.title}?`,
                content: <>{props.title}</>,
                onOk: () => { ctx.resource.del?.(record); }
            });
        };
        actions.push(<Button key="delete_button" danger icon={<CloseOutlined />} onClick={onDelete} type="text"></Button>);
    }



    const cardTitle = selectContext ?
        <Checkbox value={record[selectContext.key]} key={record[selectContext.key]}
            onClick={(evt) => { evt.stopPropagation(); } }
        >{props.title}</Checkbox>
        : props.title;

    if (cardProps.extra) {
        actions.push(cardProps.extra(ctx.resource));
    }
    return <>
        <Card
            hoverable
            cover={props.cover}
            onClick={(evt) => {
                evt.stopPropagation();
                if (ctx.resource.update) {
                    ctx.openEditor(record, { title: <>{ctx.options.title} / {props.title}</> });
                }
            } }

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
    </>;
}
