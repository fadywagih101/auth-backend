import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, name: string, password: string): Promise<User> {
    this.logger.log(`Creating user with email: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, name, password: hashedPassword });
    return user.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Looking up user by email: ${email}`);
    return this.userModel.findOne({ email });
  }
}
