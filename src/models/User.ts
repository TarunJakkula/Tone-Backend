import { Document, Schema, model } from "mongoose";

export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  refreshTokens: IRefreshToken[];
  notes: (NoteType | TodoListType)[];
}

type NoteType = {
  Heading: string;
  SubHeading?: string;
  Body: string;
  color: string;
};

type TodoListType = {
  Heading: string;
  List: ListItemType[];
  color: string;
};

type ListItemType = {
  Title: string;
  Completed: boolean;
};

const userSchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshTokens: [
    {
      token: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
    },
  ],
  notes: { type: Array, default: [] },
});

const User = model<IUser>("User", userSchema);
export default User;
