import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"



const connectDB = async () => {
    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    } catch (error) {
        console.error("error connecting db", error)
        process.exit(1)
    }
}

export default connectDB;