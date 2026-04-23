// Stub for expo-crypto — use native crypto in web
export const randomUUID = () => crypto.randomUUID();
const expoCryptoStub = { randomUUID };
export default expoCryptoStub;
