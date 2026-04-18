import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db';
import * as schema from '../../db/schema';
import { eq, or, sql, desc } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { UserRole, UserLevel } from '../../common/enums/user.enum';
import {
  RegisterDto,
  UpdateUserDto,
  ChangePasswordDto,
  AdminUpdateUserDto,
} from './dto';

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private db: DrizzleClient) {}

  async create(registerDto: RegisterDto): Promise<schema.User> {
    const { username, password, email, phone, nickname } = registerDto;

    const conditions = [eq(schema.users.username, username)];
    if (email) conditions.push(eq(schema.users.email, email));
    if (phone) conditions.push(eq(schema.users.phone, phone));

    const existingUsers = await this.db
      .select()
      .from(schema.users)
      .where(or(...conditions));

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === username) {
        throw new ConflictException('用户名已存在');
      }
      if (email && existingUser.email === email) {
        throw new ConflictException('邮箱已被注册');
      }
      if (phone && existingUser.phone === phone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await this.db
      .insert(schema.users)
      .values({
        username,
        password: hashedPassword,
        email,
        phone,
        nickname: nickname || username,
        role: UserRole.USER,
        level: UserLevel.BASIC,
        points: 100,
        totalPoints: 100,
      })
      .returning();

    return user;
  }

  async findByUsername(username: string): Promise<schema.User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));
    return user || null;
  }

  async findById(id: string): Promise<schema.User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user || null;
  }

  async findByIdWithSubscription(
    id: string,
  ): Promise<
    (schema.User & { subscription: schema.Subscription | undefined }) | null
  > {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    if (!user) return null;

    const [subscription] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, id));

    return { ...user, subscription };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<schema.User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    await this.db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<schema.User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const [existingEmail] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, updateUserDto.email));
      if (existingEmail) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const [existingPhone] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.phone, updateUserDto.phone));
      if (existingPhone) {
        throw new ConflictException('手机号已被使用');
      }
    }

    const [updatedUser] = await this.db
      .update(schema.users)
      .set(updateUserDto)
      .where(eq(schema.users.id, id))
      .returning();

    return updatedUser;
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.db
      .update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.id, id));
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ users: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const users = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        phone: schema.users.phone,
        nickname: schema.users.nickname,
        avatar: schema.users.avatar,
        role: schema.users.role,
        level: schema.users.level,
        points: schema.users.points,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);

    return { users, total: count };
  }

  async adminUpdate(
    id: string,
    adminUpdateDto: AdminUpdateUserDto,
  ): Promise<schema.User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const [updatedUser] = await this.db
      .update(schema.users)
      .set(adminUpdateDto)
      .where(eq(schema.users.id, id))
      .returning();

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async updatePoints(id: string, points: number): Promise<schema.User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const newPoints = user.points + points;
    const newTotalPoints =
      points > 0 ? user.totalPoints + points : user.totalPoints;

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({
        points: newPoints,
        totalPoints: newTotalPoints,
      })
      .where(eq(schema.users.id, id))
      .returning();

    return updatedUser;
  }
}
