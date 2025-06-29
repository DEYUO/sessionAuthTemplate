export interface IUser {
  _id: string;
  name: string;
  email: string;
  hash?: string;
  createdAt?: Date;
  lastModifiedAt?: Date;
  status: boolean;
  group: TUserGroup;
}

export type TUserGroup = "Administrator" | "Manager" | "User";