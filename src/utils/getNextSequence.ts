import { ReturnDocument } from 'mongodb';
import { db } from '../bigchaindb';

export default async function getNextSequence(name: string) {
    try {
        const ret = await db.collection('counters').findOneAndUpdate({ id: name },
            { $inc: { seq: 1 } },
            { returnDocument: ReturnDocument.AFTER }
        );

        return (ret.value as any).seq;
    }
    catch (e) {
        return null;
    }
 }