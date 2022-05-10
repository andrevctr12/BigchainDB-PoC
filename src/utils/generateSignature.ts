import {
    MessageTypes,
    signTypedData,
    SignTypedDataVersion,
    TypedMessage,
} from '@metamask/eth-sig-util';

export default function generateSignature() {
    const contractAddress = '0x6ED7d1865AED96788e8009ac99052a3290785b9A';
    const deadline = Date.now() + 100000;
    const netId = 1337;

    const types = {
        EIP712Domain: [
            {
                name: 'name',
                type: 'string',
            },
            {
                name: 'version',
                type: 'string',
            },
            {
                name: 'chainId',
                type: 'uint256',
            },
            {
                name: 'verifyingContract',
                type: 'address',
            },
        ],
        MyFunction: [
            { name: 'sender', type: 'address' },
            { name: 'x', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
        ],
    };

    const primaryType = 'MyFunction';
    const domain = {
        name: 'Test',
        version: '1',
        chainId: netId,
        verifyingContract: contractAddress,
    };

    const message = {
        sender: '0x75821C702Bca212971bce1794fa9A129E63bcEA8',
        x: 137,
        deadline: deadline,
    };

    const privateKey = Buffer.from(
        '0f3e219d5f08182e423cd6f4a36035c69250e97264907294cf9ab73b7dd57c29',
        'hex'
    );

    // @ts-ignore
    const signature = signTypedData({
        privateKey,
        data: { types, primaryType, domain, message },
        version: SignTypedDataVersion.V4,
    });

    console.log('deadline:', deadline);
    console.log('signature:', signature);

    // console.log(vrs);
}
