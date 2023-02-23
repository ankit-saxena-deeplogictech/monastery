const getSecret = (length=20) => base32.encode(crypto.randomBytes(length), "RFC4648");
