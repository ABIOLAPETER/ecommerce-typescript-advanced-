import { JwtPayload } from 'jsonwebtoken';
export {}; // This makes the file an external module

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload | string;
        }
    }
}
