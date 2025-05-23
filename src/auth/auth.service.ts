import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signUpDto: SignUpDto) {
    const { email, name, password } = signUpDto;
    this.logger.log(`Signup attempt for ${email}`);
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
        this.logger.warn(`Signup failed - Email already exists: ${email}`);
        throw new ConflictException('Email already in use');
    }

    const user = await this.usersService.create(email, name, password);
    this.logger.log(`User created: ${email}`);

    return {
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async signin(signInDto: SignInDto) {
    const { email, password } = signInDto;
    this.logger.log(`Signin attempt for ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Signin failed - Email not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      this.logger.warn(`Signin failed - Invalid password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { sub: user._id, email: user.email };
    const token = await this.jwtService.signAsync(payload);
    
    this.logger.log(`Signin success for ${email}`);

    return { token };
  }
}
