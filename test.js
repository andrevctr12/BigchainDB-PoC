const Orm = require('bigchaindb-orm')
const BigchainDB = require('bigchaindb-driver')
const bip39 = require('bip39')

const API_PATH = 'https://test.ipdb.io/api/v1/'
const conn = new BigchainDB.Connection(API_PATH)

class DID extends Orm {
    constructor(entity) {
        super(API_PATH)
        this.entity = entity
    }
}

const seed = bip39.mnemonicToSeed().slice(0,32)

const alice = new BigchainDB.Ed25519Keypair()
const car = new BigchainDB.Ed25519Keypair()
const sensorGPS = new BigchainDB.Ed25519Keypair()

const userDID = new DID(alice.publicKey)
const carDID = new DID(car.publicKey)
const gpsDID = new DID(sensorGPS.publicKey)

userDID.define("myModel", "https://schema.org/v1/myModel")
carDID.define("myModel", "https://schema.org/v1/myModel")
gpsDID.define("myModel", "https://schema.org/v1/myModel")

userDID.myModel.create({
    keypair: alice,
    data: {
        name: 'Alice',
        bithday: '03/08/1910'
    }
}).then(asset => {
    userDID.id = 'did:' + asset.id
    document.body.innerHTML +='<h3>Transaction created</h3>'
    document.body.innerHTML +=asset.id
})

const vehicle = {
    value: '6sd8f68sd67',
    power: {
      engine: '2.5',
      hp: '220 hp',
    },
    consumption: '10.8 l',
}

carDID.myModel.create({
    keypair: alice,
    data: {
        vehicle
    }
}).then(asset => {
    carDID.id = 'did:' + asset.id
    document.body.innerHTML +='<h3>Transaction created</h3>'
    document.body.innerHTML +=txTelemetrySigned.id
})

gpsDID.myModel.create({
    keypair: car,
    data: {
        gps_identifier: 'a32bc2440da012'
    }
}).then(asset => {
    gpsDID.id =  'did:' + asset.id
    document.body.innerHTML +='<h3>Transaction created</h3>'
    document.body.innerHTML +=txTelemetrySigned.id

})

function updateMileage(did, newMileage){
    did.myModel
    .retrieve(did.id)
    .then(assets => {
        // assets is an array of myModel
        // the retrieve asset contains the last (unspent) state
        // of the asset
        return assets[0].append({
            toPublicKey: car.publicKey,
            keypair: car,
            data: { newMileage }
        })
    })
    .then(updatedAsset => {
        did.mileage =  updatedAsset.data.newMileage
        document.body.innerHTML +='<h3>Append transaction created</h3>'
        document.body.innerHTML +=txTelemetrySigned.id
        return updatedAsset
    })
}