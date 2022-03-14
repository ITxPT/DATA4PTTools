import { RightOutlined } from "@ant-design/icons";
import {
  Col,
  PageHeader,
  Progress,
  Row,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import axios from "axios";
import mqtt from "mqtt";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import "./Validate.css";

const apiUrl = "http://localhost:1222/api";

function StatusTag({ status }) {
  let color = "blue";

  switch (status) {
    case "valid":
      color = "green";
      break;
    case "invalid":
      color = "red";
      break;
    default:
      break;
  }

  return <Tag color={color}>{status.toLowerCase()}</Tag>
}

function JobRow({ data }) {
  const { name, status } = data;

  return (
    <Row className="progress-card-content progress-card-job">
      <Col span={16}>{name}</Col>
      <Col style={{ display: "flex", justifyContent: "right" }} span={8}>
        <StatusTag status={status} />
      </Col>
    </Row>
  );
}

function ProgressCard({ data }) {
  const [open, setOpen] = useState(false);
  const jobs = Object.keys(data.jobStatus).map(k => ({
    name: k,
    status: data.jobStatus[k],
  }));

  function progressDetails() {
    if (!open) {
      return null;
    }

    return (
      <Row className="progress-card-jobs">
        {jobs.map(v => <JobRow data={v} key={v.name} />)}
      </Row>
    );
  }

  return (
    <Row className="progress-card" key={data.name} onClick={() => setOpen(!open)}>
      <Row className="progress-card-content">
        <RightOutlined className={["progress-card-icon", open ? "open" : "closed"].join(" ")} />
        <Typography.Text className="progress-card-text">{data.name}</Typography.Text>
        <StatusTag status={data.status} />
        { data.status === "running" && 
          <Progress
            percent={~~(100 * (data.completed / data.count))}
            showInfo={false}
            strokeWidth={3}
            style={{ padding: "0 10px" }}
          />
        }
      </Row>
      {progressDetails()}
    </Row>
  )
}

function ProgressCardSkeleton() {
  return (
    <Row className="progress-card">
      <Row className="progress-card-content">
        <Skeleton rows={2} title={false} active />
      </Row>
    </Row>
  );
}

export default function Validate() {
  const [session, setSession] = useState(null);
  const { sid } = useParams();
  const [searchParams] = useSearchParams();
  const [progress, setProgress] = useState([]);

  function progressCards(session) {
    if (!session) {
      return null;
    }
    if (!progress.length) {
      return session.files.map(f => <ProgressCardSkeleton key={f.name} active />)
    }

    return progress.map(p => <ProgressCard data={p} key={p.name} />);
  }

  function decodeMessage(payload) {
    try {
      const data = JSON.parse(payload.toString())
        .map(p => {
          return {
            ...p,
            name: truncName(p.name), 
          };
        });
      
      setProgress(data.sort((a, b) => a.name > b.name ? 1 : -1));
    } catch (err) {
      console.log("error caught decoding payload", err);
    }
  }

  function truncName(name) {
    const trunc = [];
    const nameSlice = name.split("/");
    
    if (nameSlice.length > 1) {
      trunc.push(nameSlice[0].split(".").pop(), "..");
    }

    trunc.push(nameSlice.pop());

    return trunc.join("/");
  }

  useEffect(() => {
    if (!session) {
      axios(`${apiUrl}/${sid}`).then(res => {
        setSession(res.data);
      });
      return
    }

    const client = mqtt.connect("ws://localhost:1888/ws")

    client.subscribe(`progress/${sid}`);

    client.on("connect", () => {
      console.log("connected");
    });

    client.on("message", (topic, payload) => decodeMessage(payload));

    axios(`${apiUrl}/${sid}/validate?schema=${searchParams.get("schema")}`)
      .then(res => {
        const progress = res.data.map(v => {
          return {
            name: truncName(v.name),
            status: v.valid ? "valid" : "invalid",
            jobStatus: v.validations.reduce((o, v) => {
              o[v.name] = v.valid ? "valid" : "invalid";
              return o;
            }, {}),
          }
        });

        setProgress(progress.sort((a, b) => a.name > b.name ? 1 : -1));
      })
      .catch(err => {
        console.log(err)
      });

    return () => client.end();
  }, [sid, session, searchParams]);


  return (
    <Row justify="center">
      <Col span={24} lg={20} xl={16} xxl={12} style={{ padding: "24px" }}>
        <PageHeader title="Greenlight" subTitle="validation" />
        <Row key="validation-container" style={{ padding: "0 24px" }}>
          <Col span={24}>{progressCards(session)}</Col>
        </Row>
      </Col>
    </Row>

  );
}
