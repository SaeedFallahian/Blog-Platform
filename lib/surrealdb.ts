import {Surreal} from 'surrealdb'
const db = new Surreal()
  let isConnected = false

export const connectDB = async () => {
  if (isConnected) return
  try {
    await db.connect("wss://saeed-06b66kijc1q7jc8ipd0mv9ii1s.aws-euw1.surreal.cloud", {
      namespace: "test",
      database: "test",
      auth: {
        username: "root",
        password: "root",
      }
    });
    isConnected = true
    console.log('Connect Shodid')
  } catch (error) {
    console.log('Connect Nashodid')
  }
}
export default db