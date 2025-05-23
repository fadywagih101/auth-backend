import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('should throw if email already exists', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({});

      await expect(
        authService.signup({
          email: 'test@example.com',
          name: 'Test',
          password: 'Pass123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return user data', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue({
        _id: '123',
        email: 'test@example.com',
        name: 'Test',
      });

      const result = await authService.signup({
        email: 'test@example.com',
        name: 'Test',
        password: 'Pass123!',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test');
    });
  });

  describe('signin', () => {
    it('should throw if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.signin({ email: 'test@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password is incorrect', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        password: '$2b$10$1234567890abcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      });

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        authService.signin({ email: 'test@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return a token if credentials are correct', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        _id: '123',
        email: 'test@example.com',
        password: await require('bcrypt').hash('validpass', 10),
      });

      jest
        .spyOn(require('bcrypt'), 'compare')
        .mockResolvedValue(true);

      (jwtService.signAsync as jest.Mock).mockResolvedValue('FAKE_TOKEN');

      const result = await authService.signin({
        email: 'test@example.com',
        password: 'validpass',
      });

      expect(result.token).toBe('FAKE_TOKEN');
    });
  });
});
