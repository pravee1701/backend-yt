import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            index: true,
        },
        avatar: {
            type: String,
            required: true
        },
        coverImage: {
            type: String,

        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        passwrod: {
            type: String,
            required: [true, "Password is required"]
        },
        refreshToken: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("passwrod")) return next();
    this.passwrod = bcrypt.hash(this.passwrod, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (passwrod){
    return await bcrypt.compare(passwrod, this.passwrod)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName :this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)