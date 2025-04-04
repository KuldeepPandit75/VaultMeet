

export interface ApiResponse<T = any> {
  isSuccess?: boolean;
  isFailure?: boolean;
  isError?: boolean;
  data?: T;
  msg?: string;
  apiMsg?: any;
  status?: string | number;
  code?: number | string;
}

export interface UploadProgressHandler {
  (percentage: number): void;
}

export interface ApiFunction {
  (
    body?: any,
    showUploadProgress?: UploadProgressHandler,
    showDownloadProgress?: UploadProgressHandler
  ): Promise<ApiResponse>;
}

export interface ApiMap {
  [key: string]: ApiFunction;
}

export const API: ApiMap;
