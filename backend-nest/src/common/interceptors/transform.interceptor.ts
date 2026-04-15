import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  data: T;
  message?: string;
  timestamp: string;
}

interface ApiResponseWrapper {
  code?: number;
  data?: unknown;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T | ApiResponseWrapper) => {
        const wrapper = data as ApiResponseWrapper;
        if (wrapper && typeof wrapper === 'object' && 'code' in wrapper) {
          return {
            code: wrapper.code ?? 0,
            data: (wrapper.data ?? data) as T,
            message: wrapper.message,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          code: 0,
          data: data as T,
          message: undefined,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
