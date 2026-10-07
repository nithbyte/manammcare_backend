export class ApiResponseDto<T> {
  success: boolean;
  message?: string;
  data: T;
  code?: string;

  constructor(data: T, message?: string, success = true, code?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.code = code;
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: PaginationMeta;

  constructor(data: T[], pagination: PaginationMeta, message?: string) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
  }
}
