import {Surreal} from 'surrealdb'
const db = new Surreal()
  let isConnected = false

export const connectDB = async () => {
  if (isConnected) return
  try {
    // await db.connect("wss://saeed-06b66kijc1q7jc8ipd0mv9ii1s.aws-euw1.surreal.cloud", {
      await db.connect('ws://127.0.0.1:8000', {      namespace: "test",
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