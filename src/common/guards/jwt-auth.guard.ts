import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    try {
      const secret = process.env.JWT_SECRET ?? 'dev-secret';
      const payload = verify(token, secret);
      request.user = payload;
      return true;
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        // Admin access tokens are allowed to stay valid even when expiration exists.
        try {
          const secret = process.env.JWT_SECRET ?? 'dev-secret';
          const payload = verify(token, secret, { ignoreExpiration: true });
          if ((payload as any)?.role === 'admin') {
            request.user = payload;
            return true;
          }
        } catch {
          // fall through to throw below
        }
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
