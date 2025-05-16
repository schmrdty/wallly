import { DataTypes, Model, Sequelize, Optional } from 'sequelize';

/**
 * User model for authentication and tracking.
 */
export interface UserAttributes {
    id: number;
    username: string;
    passwordHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public username!: string;
    public passwordHash!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

/**
 * Token model for ERC20/other tokens tracked or whitelisted.
 */
export interface TokenAttributes {
    id: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TokenCreationAttributes extends Optional<TokenAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Token extends Model<TokenAttributes, TokenCreationAttributes> implements TokenAttributes {
    public id!: number;
    public address!: string;
    public name!: string;
    public symbol!: string;
    public decimals!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

/**
 * MiniAppSession model for tracking active session per user.
 * Maps to the smart contract's session struct:
 *   delegate: address, expiresAt: uint256, allowedTokens: address[], allowEntireWallet: bool, active: bool
 */
export interface MiniAppSessionAttributes {
    id: number;
    userAddress: string;
    delegate: string;
    expiresAt: Date;
    allowedTokens: string[]; // array of token contract addresses
    allowEntireWallet: boolean;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MiniAppSessionCreationAttributes extends Optional<MiniAppSessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class MiniAppSession extends Model<MiniAppSessionAttributes, MiniAppSessionCreationAttributes>
    implements MiniAppSessionAttributes {
    public id!: number;
    public userAddress!: string;
    public delegate!: string;
    public expiresAt!: Date;
    public allowedTokens!: string[];
    public allowEntireWallet!: boolean;
    public active!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

/**
 * Permission model for mapping contract permissions (getUserPermission).
 */
export interface PermissionAttributes {
    id: number;
    userAddress: string;
    withdrawalAddress: string;
    allowEntireWallet: boolean;
    expiresAt: Date;
    isActive: boolean;
    tokenList: string[];      // array of token addresses
    minBalances: string[];    // string[] for big numbers
    limits: string[];         // string[] for big numbers
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Permission extends Model<PermissionAttributes, PermissionCreationAttributes>
    implements PermissionAttributes {
    public id!: number;
    public userAddress!: string;
    public withdrawalAddress!: string;
    public allowEntireWallet!: boolean;
    public expiresAt!: Date;
    public isActive!: boolean;
    public tokenList!: string[];
    public minBalances!: string[];
    public limits!: string[];
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

/**
 * Core contract events for tracking token forwarding & permissions.
 */

export interface TransferPerformedEventAttributes {
    id: number;
    user: string;
    token: string;
    amount: string;
    destination: string;
    userRemaining: string;
    oracleTimestamp: string;
    blockTimestamp: string;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TransferPerformedEventCreationAttributes extends Optional<TransferPerformedEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class TransferPerformedEvent
    extends Model<TransferPerformedEventAttributes, TransferPerformedEventCreationAttributes>
    implements TransferPerformedEventAttributes {
    public id!: number;
    public user!: string;
    public token!: string;
    public amount!: string;
    public destination!: string;
    public userRemaining!: string;
    public oracleTimestamp!: string;
    public blockTimestamp!: string;
    public transactionHash!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export interface PermissionGrantedEventAttributes {
    id: number;
    user: string;
    withdrawalAddress: string;
    allowEntireWallet: boolean;
    expiresAt: Date;
    tokenList: string[];
    minBalances: string[];
    limits: string[];
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PermissionGrantedEventCreationAttributes extends Optional<PermissionGrantedEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PermissionGrantedEvent
    extends Model<PermissionGrantedEventAttributes, PermissionGrantedEventCreationAttributes>
    implements PermissionGrantedEventAttributes {
    public id!: number;
    public user!: string;
    public withdrawalAddress!: string;
    public allowEntireWallet!: boolean;
    public expiresAt!: Date;
    public tokenList!: string[];
    public minBalances!: string[];
    public limits!: string[];
    public transactionHash!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export interface PermissionRevokedEventAttributes {
    id: number;
    user: string;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PermissionRevokedEventCreationAttributes extends Optional<PermissionRevokedEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class PermissionRevokedEvent
    extends Model<PermissionRevokedEventAttributes, PermissionRevokedEventCreationAttributes>
    implements PermissionRevokedEventAttributes {
    public id!: number;
    public user!: string;
    public transactionHash!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export interface MiniAppSessionGrantedEventAttributes {
    id: number;
    user: string;
    delegate: string;
    tokens: string[];
    allowEntireWallet: boolean;
    expiresAt: Date;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MiniAppSessionGrantedEventCreationAttributes extends Optional<MiniAppSessionGrantedEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class MiniAppSessionGrantedEvent
    extends Model<MiniAppSessionGrantedEventAttributes, MiniAppSessionGrantedEventCreationAttributes>
    implements MiniAppSessionGrantedEventAttributes {
    public id!: number;
    public user!: string;
    public delegate!: string;
    public tokens!: string[];
    public allowEntireWallet!: boolean;
    public expiresAt!: Date;
    public transactionHash!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export interface MiniAppSessionRevokedEventAttributes {
    id: number;
    user: string;
    delegate: string;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MiniAppSessionRevokedEventCreationAttributes extends Optional<MiniAppSessionRevokedEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class MiniAppSessionRevokedEvent
    extends Model<MiniAppSessionRevokedEventAttributes, MiniAppSessionRevokedEventCreationAttributes>
    implements MiniAppSessionRevokedEventAttributes {
    public id!: number;
    public user!: string;
    public delegate!: string;
    public transactionHash!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

export const initializeModels = (sequelize: Sequelize) => {
    User.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            passwordHash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'users',
            timestamps: true,
        }
    );

    Token.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            symbol: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            decimals: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'tokens',
            timestamps: true,
        }
    );

    MiniAppSession.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            userAddress: {
                type: DataTypes.STRING,
                allowNull: false,
                index: true,
            },
            delegate: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            allowedTokens: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            allowEntireWallet: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'mini_app_sessions',
            timestamps: true,
        }
    );

    Permission.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            userAddress: {
                type: DataTypes.STRING,
                allowNull: false,
                index: true,
            },
            withdrawalAddress: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            allowEntireWallet: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            tokenList: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            minBalances: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            limits: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
        },
        {
            sequelize,
            tableName: 'permissions',
            timestamps: true,
        }
    );

    TransferPerformedEvent.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            token: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            amount: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            destination: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            userRemaining: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            oracleTimestamp: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            blockTimestamp: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            transactionHash: {
                type: DataTypes.STRING,
                allowNull: false,
                index: true,
            },
        },
        {
            sequelize,
            tableName: 'transfer_performed_events',
            timestamps: true,
        }
    );

    PermissionGrantedEvent.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            withdrawalAddress: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            allowEntireWallet: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            tokenList: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            minBalances: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            limits: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            transactionHash: {
                type: DataTypes.STRING,
                allowNull: false,
                index: true,
            },
        },
        {
            sequelize,
            tableName: 'permission_granted_events',
            timestamps: true,
        }
    );

    PermissionRevokedEvent.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            transactionHash: {
                type: DataTypes.STRING,
                allowNull: false,
                index: true,
            },
        },
        {
            sequelize,
            tableName: 'permission_revoked_events',
            timestamps: true,
        }
    );

    MiniAppSessionGrantedEvent.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            delegate: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            tokens: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: [],
            },
            allowEntireWallet: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            transactionHash: {
                type: DataTypes.STRING,
                allowNull: false,
                index: true,
            },
        },
        {
            sequelize,
            tableName: 'mini_app_session_granted_events',
            timestamps: true,
        }
    );

    MiniAppSessionRevokedEvent.init(
        {
            id: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            delegate: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            transactionHash: {
                type: DataTypes.STRING,
                allowNull: false,
                index: true,
            },
        },
        {
            sequelize,
            tableName: 'mini_app_session_revoked_events',
            timestamps: true,
        }
    );
};