import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((res) => {
        // If controller already returned structured PaginatedResponse or ApiResponse
        if (res && typeof res === 'object' && 'success' in res && ('data' in res || 'pagination' in res)) {
          return res;
        }

        return {
          success: true,
          data: res ?? null,
          message: 'Success',
        };
      }),
    );
  }
}
