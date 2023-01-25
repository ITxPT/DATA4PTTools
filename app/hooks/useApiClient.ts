import ApiClient from '../api/client'

export const client = new ApiClient(process.env.API_URL ?? '')

const useApiClient = (): ApiClient => {
  return client
}

export default useApiClient
