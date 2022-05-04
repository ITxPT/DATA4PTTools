import axios from 'axios';
import crypto from 'crypto-js';

async function calculateChecksum(file: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const data = crypto.lib.WordArray.create(reader.result as any);
      const hash = crypto.SHA256(data).toString();

      resolve({ checksum: hash, params: { a: 1 }, header: { b: 2 }});
    };
  });
}

export type Session = {
  id: string;
  ref: string;
  created: number;
  stopped: number;
  files: string[];
  status: string;
  results: any[];
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

  async ping() {
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

  async addFile(id: string, file: File, onProgress?: (p: any) => void) {
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

  async validate(id: string, schema: string, rules: string[]) {
    return axios({
      method: 'get',
      url: this.withUrl(`sessions/${id}/validate`),
      params: { schema, rules },
      paramsSerializer: params => {
        return Object.keys(params).map((k) => {
          const v = params[k];

          return (Array.isArray(v) ? v : [v])
            .map(v => `${k}=${v}`)
            .join('&');
        })
        .join('&');
      },
    })
    .then(res => res.data);
  }

  reportLink(id: string, format: string) {
    return `${this.url}/report/${id}?f=${format}`;
  }

  reportFileLink(id: string, name: string, format: string) {
    return `${this.url}/report/${id}/${name}?f=${format}`;
  }
}

export default ApiClient;
