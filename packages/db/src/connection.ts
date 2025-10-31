import mongoose from 'mongoose';

export interface ConnectionOptions {
  maxPoolSize?: number;
  minPoolSize?: number;
  socketTimeoutMS?: number;
  serverSelectionTimeoutMS?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(options?: ConnectionOptions): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const dbName = process.env.MONGODB_DB_NAME || 'pg-prepaid';

    try {
      await mongoose.connect(uri, {
        dbName,
        maxPoolSize: options?.maxPoolSize || 10,
        minPoolSize: options?.minPoolSize || 2,
        socketTimeoutMS: options?.socketTimeoutMS || 45000,
        serverSelectionTimeoutMS: options?.serverSelectionTimeoutMS || 5000,
        family: 4, // Use IPv4
      });

      this.isConnected = true;
      console.log(`Connected to MongoDB database: ${dbName}`);

      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnection(): typeof mongoose {
    return mongoose;
  }
}

export const dbConnection = DatabaseConnection.getInstance();
