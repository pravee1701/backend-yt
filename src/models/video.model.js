import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: string,
            requierd: true,

        },
        thumbnail: {
            type: string,
            requierd: true, 
        },
        title: {
            type: string,
            requierd: true, 
        },
        description: {
            type: string,
            requierd: true, 
        },
        duration: {
            type: Number,
            requierd: true, 
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        }

    },
    {
        timestamps: true,
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)