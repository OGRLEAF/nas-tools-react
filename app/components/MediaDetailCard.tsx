import React, { useEffect, useState } from "react";
import { API, NastoolMediaDetail } from "../utils/api";
import { Empty, Card, Image, Space, theme, Typography } from "antd"

export function MediaDetailCard({
    mediaDetail
}: { mediaDetail: NastoolMediaDetail }) {
    const { token } = theme.useToken()
    if (mediaDetail) {
        return <div>
            <div style={{
                backgroundImage: `url(${mediaDetail.background[0]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: "400px",
                width: "100%",
                marginBottom: 0,
                position: "relative"
            }}>
                <div style={{ height: "100%", width: "100%", backgroundColor: "#00152991" }} />
                <Space style={{
                    margin: 15,
                    position: "absolute", left: 0, bottom: 15,
                    paddingLeft: 10,
                    zIndex: 10
                }}
                    align="start"
                    size={32}
                >
                    <Image
                        style={{ width: 200, objectFit: "contain", }}
                        src={mediaDetail.image} />
                    <Typography style={{ paddingTop: 15 }}>
                        <Typography.Text style={{ color: token.colorTextLightSolid }}>{mediaDetail.overview}</Typography.Text>
                        <Typography.Title level={2} style={{ color: token.colorTextLightSolid }}>{mediaDetail.title}
                            <span style={{ fontSize: "0.7em" }}> ({mediaDetail.year})</span>
                        </Typography.Title>
                        <Typography.Text style={{ color: token.colorTextLightSolid }}>
                            {mediaDetail.genres}
                        </Typography.Text>
                    </Typography>

                </Space>
            </div>



        </div>
    } else {
        return <Empty />
    }
}