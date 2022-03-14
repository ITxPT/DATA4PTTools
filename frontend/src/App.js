import {
  Button,
  Col,
  Collapse,
  Form,
  PageHeader,
  Row,
  Select,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUpload from "./components/FileUpload";
import "./App.css";

const apiUrl = "http://localhost:1222/api";

export default function App() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [session, setSession] = useState("session", {});
  const [hasFiles, setHasFiles] = useState(false);

  function validate() {
    navigate(`/${session.id}/validate?schema=${form.getFieldValue("schema")}`);
  }

  useEffect(() => {
    if (session.id) {
      axios(`${apiUrl}/${session.id}`).catch(() => setSession(null))
    } else {
      // TODO handle better
      axios(`${apiUrl}/session`).then(res => setSession(res.data));
    }
  });

  return (
    <Row justify="center">
      <Col span={24} lg={20} xl={16} xxl={12} style={{ padding: "24px" }}>
        <div className="card">
          <PageHeader title="Greenlight" subTitle="validation" style={{ borderBottom: "1px solid rgb(235, 237, 240)" }} />
          <Form form={form} layout="vertical" initialValues={{schema: "netex"}} style={{ margin: "24px 24px 12px 24px" }}>
            <Collapse defaultActiveKey={["1"]} className="file-upload-config"> 
              <Collapse.Panel header="Configuration">
                <Form.Item label="Schema" name="schema" tooltip="Some generic description of schemas">
                  <Select placeholder="Select schema">
                    <Select.Option value="netex">NeTEx</Select.Option>
                    <Select.Option value="epip">EPIP</Select.Option>
                  </Select>
                </Form.Item>
              </Collapse.Panel>
            </Collapse>
          </Form>
          <Row style={{ padding: "0 24px" }}>
            <Col span={24}>
              <FileUpload session={session} action={apiUrl} onChange={fileList => {
                setHasFiles(fileList.length && !fileList.some(file => file.status !== "done"))
              }} />
            </Col>
          </Row>
          <div style={{ padding: "10px 24px 24px 24px", display: "flex", justifyContent: "right" }}>
            <Button type="primary" disabled={!hasFiles && session} onClick={validate}>Validate</Button>
          </div>
        </div>
      </Col>
    </Row>
  );
}
