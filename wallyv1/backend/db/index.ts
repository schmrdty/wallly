import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    process.env.PG_DB_NAME!,
    process.env.PG_DB_USER!,
    process.env.PG_DB_PASSWORD!,
    {
        host: process.env.PG_DB_HOST,
        dialect: 'postgres',
        logging: false,
    }
);

// Minimal Token model for fallback
import { DataTypes, Model } from 'sequelize';

export class Token extends Model {
    public address!: string;
    public name!: string;
    public symbol!: string;
    public decimals!: number;
    public url?: string;
}

Token.init(
    {
        address: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        symbol: { type: DataTypes.STRING, allowNull: false },
        decimals: { type: DataTypes.INTEGER, allowNull: false },
        url: { type: DataTypes.STRING, allowNull: true },
    },
    {
        sequelize,
        tableName: 'tokens',
        timestamps: true,
    }
);

export { sequelize };