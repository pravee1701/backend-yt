import mongoose, {Schema} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


const getVideoComments = asyncHandler(async(req, res) => {
    const videoId = req.params;
    const { page= 1, limit= 10} = req.query;

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    const commentAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likes"
                },
                owner: {
                    $first:"$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likeBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1, 
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    avatar: 1
                },
                isLiked: 1
            }
        }

    ]);

    const options= {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }

    const comments = await Comment.aggregatePaginate(
        commentAggregate, 
        options
    )

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))

})

const addComment = asyncHandler(async(req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(!content){
        throw new ApiError(400 , "content is required")
    }


    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    });

    if(!comment){
        throw new ApiError(500, "Failed to add comment please try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(!content){
        throw new ApiError(400, "content is required")
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not the owner of this comment")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        comment?._id, 
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!updateComment){
        throw new ApiError(500, "Failed to update comment please try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400, "Only comment owner can delete their comment")
    }

    await Comment.findByIdAndDelete(commentId)

    await Like.deleteMany({
        comment: commentId,
        likeBy: req.user
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {commentId}, "Comment deleted successfully"))

})


export {
    getVideoComments, 
    addComment,
    updateComment,
    deleteComment,
}