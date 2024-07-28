import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Like } from "../models/like.model";
import { ApiResponse } from "../utils/ApiResponse";



const toggleVideoLike = asyncHandler(async(req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const likedAlready = await Like.findOne({
        video: videoId,
        likeBy: req.user?._id
    })

    if(likedAlready){
        await Like.findOneAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "Like toggle successfully"))
    }

    const likeVideo = await Like.create({
        video: videoId,
        likeBy: req.user?._id
    })

    if(!likeVideo){
        throw new ApiError(500, "Failed to like video")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: true}, "Video liked successfully"))
})

const toggleCommetLike = asyncHandler(async(req, res) => {
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const likedAlready = await Comment.findOne({
        _id: commentId,
        likeBy: req.user?._id
    })

    if(likedAlready){
        await Comment.findOneAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}), "Comment unliked successfully")
    }

    const likeComment = await Like.create({
        comment: commentId,
        likeBy: req.user?._id
    })

    if(!likeComment){
        throw new ApiError(500, "Failed to like comment please try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: true}, "Comment liked successfully"))
})


const toggleTweetLike = asyncHandler(async(req, res) => {
    const { tweetId } = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const likedAlready = await Tweet.findOne({
        tweet: tweetId,
        likeBy: req.user?._id
    })

    if(likedAlready){
        await Tweet.findOneAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(200, {isLiked: false}, "Tweet unliked successfully"))
    }

    const tweet = await Like.create({
        tweet: tweetId,
        likeBy: req.user?._id
    })

    if(!tweet){
        throw new ApiError(500, "Failed to like tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: true}, "Tweet liked successfully"))
})

const getLikedVideos = asyncHandler(async(req, res) => {
    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likeBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },

                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ],
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 1,
                likeVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration:1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1
                    }
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideosAggregate, "liked videos fetched successfully"))
})

export {
    toggleCommetLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}