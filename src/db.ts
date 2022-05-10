import { INTEGER, Sequelize, STRING } from 'sequelize';

import { User } from './models';

const sequelize = new Sequelize('login-with-metamask-database', '', undefined, {
	dialect: 'sqlite',
	storage: './db.sqlite',
	logging: true,
});

// Init all models
User.init(
	{
		nonce: {
			allowNull: false,
			type: INTEGER.UNSIGNED, // SQLITE will use INTEGER
			defaultValue: (): number => Math.floor(Math.random() * 10000), // Initialize with a random nonce
		},
		publicAddress: {
			allowNull: false,
			type: STRING,
			unique: true,
			validate: { isLowercase: true },
		},
		privateKey: {
			allowNull: false,
			type: STRING,
			unique: true,
		},
		publicKey: {
			allowNull: false,
			type: STRING,
			unique: true,
		},
		username: {
			type: STRING,
			unique: true,
		},
	},
	{
		modelName: 'user',
		sequelize, // This bit is important
		timestamps: false,
	}
);

// Create new tables
sequelize.sync();

export { sequelize };
