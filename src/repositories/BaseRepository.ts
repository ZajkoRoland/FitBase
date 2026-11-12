import { ApiClient } from '@/lib/api/ApiClient';

// Alaposztály a backend végpontokat elérő repository réteghez
export abstract class BaseRepository {
  protected readonly api: ApiClient;

  protected constructor(api: ApiClient = ApiClient.getInstance()) {
    this.api = api;
  }
}
