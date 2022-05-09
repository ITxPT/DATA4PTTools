import ApiClient from '../api/client';

const client = new ApiClient(process.env.API_URL || 'http://localhost:8080');

const useApiClient = (): ApiClient => {
  return client;
}

export default useApiClient;
