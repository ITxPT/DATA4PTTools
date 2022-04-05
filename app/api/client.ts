import axios from 'axios';
import crypto from 'crypto-js';

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

type Session = {
  id: string;
  created: number;
  stopped: number;
  files: string[];
  status: string;
}

class ApiClient {
  private url: string;
  private basePath: string = '/api';

  constructor(url: string) {
    this.url = url;
  }

  private withUrl(path: string): string {
    return this.url + this.basePath + '/' + path;
  }

  async ping(): Promise<void> {
    return axios({
      method: 'get',
      url: this.withUrl('ping'),
    });
  }

  async createSession(): Promise<Session> {
    return axios({
      method: 'post',
      url: this.withUrl('sessions'),
    })
    .then(res => res.data);
  }

  async sessions(): Promise<Session[]> {
    return axios({
      method: 'get',
      url: this.withUrl('sessions'),
    })
    .then(res => res.data);
  }

  async session(id: string): Promise<Session> {
    return axios({
      method: 'get',
      url: this.withUrl('sessions/' + id),
    })
    .then(res => res.data);
  }

  async addFile(id: string, file: File, onProgress?: (p) => void) {
    const { checksum } = await calculateChecksum(file);
    const data = new FormData();

    data.append('file', file);

    return axios({
      method: 'post',
      url: this.withUrl(`sessions/${id}/upload`),
      data,
      params: {
        checksum: checksum,
      },
      onUploadProgress: (p) => {
        if (onProgress) {
          onProgress(p);
        }
      },
    });
  }

  async validate(id: string) {
    return axios({
      method: 'get',
      url: this.withUrl(`sessions/${id}/validate`),
    })
    .then(res => res.data);
  }
}

export default ApiClient;
