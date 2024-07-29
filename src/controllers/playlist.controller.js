import mongoose, {isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Playlist } from "../models/playlist.model";
import { ApiResponse } from "../utils/ApiResponse";
import { Video } from "../models/video.model";


const createPlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body

    if(!name || !description){
        throw new ApiError(400, "Name and description both are required")
    }

    const playlist = await Playlist.create({
        name,
        description, 
        owner: req.user?._id
    })

    if(!playlist){
        throw new ApiError(500, "Failed to create playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"))
})


const updatePlaylist = asyncHandler(async(req, res) => {
    const { name, description } = req.body
    const { playlistId } = req.params

    if(!name || !!description){
        throw new ApiError(400, "Nmae and description both are required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }

    const existPlaylist = await Playlist.findById(playlistId)

    if(!existPlaylist){
        throw new ApiError(400, "Playlist does not found")
    }

    if(existPlaylist.owner.tostring() !== req.user?._id.tostring){
        throw new ApiError(400, "Only owner can edit the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        existPlaylist._id,
        {
            $set: {
                name, 
                description
            }
        },
        {
            name: true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to update playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const { playlistId } = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id")
    }

    const existPlaylist = await Playlist.findById(playlistId)

    if(!existPlaylist){
        throw new ApiError(400, "Playlist not found")
    }

    if(existPlaylist.owner.tostring() !== req.user?._id.tostring){
        throw new ApiError(400, "Only owner can delete the  playlist")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if(!playlist){
        throw new ApiError(400, "Failed to delete playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully"))
    
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const { videoId, playlistId } = req.params

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid video id or playlist id")
    }

    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }

    if(playlist._id.tostring() !== req.user?._id.tostring() || video._id.tostring() !== req.user?._id.tostring()){
        throw new ApiError(400, "Only owner can add video to the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet:{
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to add video to playlist please try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const { playlistId, videoId } = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id or playlist id")
    }
    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)

    if(!video){
        throw new ApiError(400, "Video not found")
    }

    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }

    if(playlist._id.tostring() !== req.user?._id.tostring() ){
        throw new ApiError(400, "Only owner can remove video from the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist._id,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to remove video from the playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))

})


const getPlaylistById = asyncHandler(async(req, res) => {
    const { playlistId } = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    const playlistVideos = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $match: {
                "videos.isPublished": true
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
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name:1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                }

            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, playlistVideos, "Playlist videos fetched successfully"))
})


const getUserPlaylists = asyncHandler(async(req, res) => {
    const { userId } = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $addFields: {
                totalVideos: {
                    $size: "$videos"
                },
                totalViews: {
                    $sum: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"))
})
export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists
}