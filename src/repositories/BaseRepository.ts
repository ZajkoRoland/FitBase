import { ApiClient } from '@/lib/api/ApiClient';

/** Base for classes that talk to one backend resource through the shared ApiClient. */
export abstract class BaseRepository {
  protected readonly api: ApiClient;

  protected constructor(api: ApiClient = ApiClient.getInstance()) {
    this.api = api;
  }
}
