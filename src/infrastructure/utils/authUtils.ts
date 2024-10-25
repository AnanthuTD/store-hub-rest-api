import { Request } from 'express';
import { ObjectId } from 'mongoose';

export function getRequestUser(req: Request): { _id: ObjectId | null } {
  return req.user || null;
}

export function getRequestUserId(req: Request): ObjectId | null {
  return req.user._id || null;
}
