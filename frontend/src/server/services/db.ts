import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UserSchema {
  id: string;
  fullName: string;
  username: string;
  email: string;
  hashedPassword: string;
  favouriteTeam: string;
  favouriteDriver: string;
  profileImage?: string;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), 'src', 'server', 'data');
const FILE_PATH = path.join(DATA_DIR, 'users.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure users.json exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
}

// Queue for atomic write operations to prevent concurrent write collisions
class AsyncLock {
  private promise: Promise<void> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void;
    const nextPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentPromise = this.promise;
    this.promise = nextPromise;
    await currentPromise;
    return release!;
  }
}

const dbLock = new AsyncLock();

export class DatabaseService {
  private static async readUsers(): Promise<UserSchema[]> {
    try {
      const data = await fs.promises.readFile(FILE_PATH, 'utf-8');
      return JSON.parse(data) as UserSchema[];
    } catch (error) {
      console.error('[DB ERROR] Failed to read database:', error);
      return [];
    }
  }

  private static async writeUsers(users: UserSchema[]): Promise<boolean> {
    const release = await dbLock.acquire();
    const tempPath = `${FILE_PATH}.tmp`;
    try {
      // Atomic write pattern: Write to temp, then rename (replaces existing file atomically)
      await fs.promises.writeFile(tempPath, JSON.stringify(users, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, FILE_PATH);
      return true;
    } catch (error) {
      console.error('[DB ERROR] Failed to write database atomically:', error);
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
      }
      return false;
    } finally {
      release();
    }
  }

  // Find all users
  static async findAll(): Promise<UserSchema[]> {
    return this.readUsers();
  }

  // Find user by ID
  static async findById(id: string): Promise<UserSchema | null> {
    const users = await this.readUsers();
    return users.find((u) => u.id === id) || null;
  }

  // Find user by Email
  static async findByEmail(email: string): Promise<UserSchema | null> {
    const users = await this.readUsers();
    const normalizedEmail = email.toLowerCase().trim();
    return users.find((u) => u.email.toLowerCase().trim() === normalizedEmail) || null;
  }

  // Find user by Username
  static async findByUsername(username: string): Promise<UserSchema | null> {
    const users = await this.readUsers();
    const normalizedUsername = username.toLowerCase().trim();
    return users.find((u) => u.username.toLowerCase().trim() === normalizedUsername) || null;
  }

  // Create a new user
  static async create(userData: Omit<UserSchema, 'id' | 'emailVerified' | 'createdAt' | 'updatedAt'>): Promise<UserSchema> {
    const users = await this.readUsers();

    // Check unique constraints
    const emailExists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      throw new Error('Email is already registered');
    }

    const usernameExists = users.some(u => u.username.toLowerCase() === userData.username.toLowerCase());
    if (usernameExists) {
      throw new Error('Username is already taken');
    }

    const timestamp = new Date().toISOString();
    const newUser: UserSchema = {
      ...userData,
      id: uuidv4(),
      emailVerified: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    users.push(newUser);
    const success = await this.writeUsers(users);
    if (!success) {
      throw new Error('Database write operation failed');
    }

    return newUser;
  }

  // Update an existing user
  static async update(id: string, updates: Partial<Omit<UserSchema, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UserSchema> {
    const users = await this.readUsers();
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new Error('User not found');
    }

    // Check unique constraints if email or username is changing
    if (updates.email && updates.email.toLowerCase() !== users[index].email.toLowerCase()) {
      const emailExists = users.some(u => u.id !== id && u.email.toLowerCase() === updates.email!.toLowerCase());
      if (emailExists) {
        throw new Error('Email is already registered');
      }
    }

    if (updates.username && updates.username.toLowerCase() !== users[index].username.toLowerCase()) {
      const usernameExists = users.some(u => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase());
      if (usernameExists) {
        throw new Error('Username is already taken');
      }
    }

    const updatedUser: UserSchema = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updatedUser;
    const success = await this.writeUsers(users);
    if (!success) {
      throw new Error('Database write operation failed');
    }

    return updatedUser;
  }

  // Find user by verification token
  static async findByVerificationToken(token: string): Promise<UserSchema | null> {
    const users = await this.readUsers();
    return users.find((u) => u.verificationToken === token) || null;
  }

  // Find user by password reset token
  static async findByResetToken(token: string): Promise<UserSchema | null> {
    const users = await this.readUsers();
    return users.find((u) => u.resetPasswordToken === token) || null;
  }
}
