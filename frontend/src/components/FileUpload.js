import {
  DeleteOutlined,
  FileOutlined,
  FileExcelTwoTone,
  FileTwoTone,
  FileZipTwoTone,
  InboxOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import axios from "axios";
import {
  Button,
  Progress,
  Row,
  Spin,
  Typography,
  Upload,
} from "antd";
import crypto from "crypto-js";
import React, { useEffect, useState } from "react";
import "./FileUpload.css";

export function FileUploadIcon({ file }) {
  let icon = <FileTwoTone />; 

  if (file.status === "uploading") {
    icon = <Spin indicator={<LoadingOutlined/>} />;
  } else if (file.status === "error") {
    icon = <FileOutlined style={{color:"white"}} />
  } else if (file.status === "done") {
    switch (file.type) {
      case "text/xml":
        icon = <FileExcelTwoTone />
        break;
      case "application/x-tar":
      case "application/zip":
      case "application/gzip":
        icon = <FileZipTwoTone />;
        break;
      default:
        break;
    }
  }

  return (
    <div className="file-upload-icon">{icon}</div>
  )
}

export function FileUploadPreview({ file, onRemove }) {
  let text = file.name;
  if (file.status === "done" && file.response) {
    const data = file.response.data;
    if (data && data.files && data.files.length > 1) {
      text = `${text} (${data.files.length} xml files found)`;
    }
  }

  return (
    <div key={file.uid} className={`file-upload-card ${file.status}`}>
      <Row className="file-upload-content">
        <FileUploadIcon file={file} />
        <Typography.Text className="file-upload-text">{text}</Typography.Text>
        <Button
          onClick={() => {
            if (onRemove) {
              onRemove(file);
            }
          }}
          type="text"
          className={"file-upload-delete"}
          icon={<DeleteOutlined />}
        />
        { file.status === "uploading" && <Progress percent={file.percent} showInfo={false} strokeWidth={3} style={{ padding: "0 10px" }} /> }
      </Row>
    </div>
  )
}

export default function FileUpload({ session, action, onChange }) {
  const [fileList, setFileList] = useState([]);

  async function calculateChecksum(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        const data = crypto.lib.WordArray.create(reader.result);
        const hash = crypto.SHA256(data).toString();

        resolve({ checksum: hash, params: { a: 1 }, header: { b: 2 }});
      };
    });
  }

  function uploadFile(info) {
    const data = new FormData();

    data.append("file", info.file);

    const req = axios.request({
      method: "post",
      url: info.action,
      data: data,
      params: {
        checksum: info.data.checksum,
      },
      onUploadProgress(p) {
        info.onProgress({ percent: ~~(100 * (p.loaded / p.total)) });
      }
    });

    req.then(data => {
      console.log(data);

      info.onSuccess(data, info.file);
    });

    req.catch(err => {
      console.log(err);

      info.onError(err, err.response, info.file);
    });
  }

  function onRemove(file) {
    setFileList(fileList.filter(v => v.uid !== file.uid));
  }

  useEffect(() => {
    if (onChange) {
      onChange(fileList);
    }
  }, [fileList, onChange]);

  return (
    <div>
      <Upload.Dragger
        name="file"
        directory={true}
        multiple={true}
        action={`${action}/${session.id}/upload`}
        data={calculateChecksum}
        listType="picture"
        showUploadList={false}
        customRequest={uploadFile}
        onChange={info => setFileList([...info.fileList])}
        fileList={fileList}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
        <p className="ant-upload-hint">
          Support for a single or bulk upload (xml, tar, gz, zip, bzip)
        </p>
      </Upload.Dragger>
        {fileList.map(file => <FileUploadPreview file={file} onRemove={onRemove} />)}
    </div>
  );
}
