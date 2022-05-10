import { Model } from 'sequelize';

export class Transaction extends Model {
    public id!: number; // Note that the `null assertion` `!` is required in strict mode.
    public from!: string;
    public to!: string;
    public value!: number;
}
