from bigchaindb_driver import BigchainDB
from bigchaindb_driver.crypto import generate_keypair

conn = BigchainDB('https://test.ipdb.io')
alice = generate_keypair()