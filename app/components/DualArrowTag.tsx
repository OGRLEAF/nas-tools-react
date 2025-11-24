import { CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons"
import { Divider, Tag } from "antd";
import React, { } from "react";


export const DualArrowTag = (props:
    { up?: number, down?: number, show?: (value?: number) => boolean, render?: (value: number) => string, bordered?: boolean }) => {
    const show = props.show ?? ((value?: number) => (value != undefined))
    const render = props.render ?? ((value) => value)
    const { bordered } = props;
    const up = props.up ?? 0;
    const down = props.down ?? 0;
    const showUp = show(up);
    const showDown = show(down);
    return showUp || showDown ? <Tag bordered={bordered} color={(down <= 0 || down == undefined) ? "green" : "blue"}>
        {showUp ? <><CaretUpOutlined /><span>{render(up)}</span></> : <></>}
        {showUp && showDown ? <Divider orientation="vertical" /> : <></>}
        {showDown ? <><CaretDownOutlined /><span>{render(down)}</span></> : <></>}
    </Tag> : <></>
}

// export const TorrentFactor = (options: { up?: number, down: number }) => {
//     const {up, down} = options;
//     const upFactor = up ? 
// }